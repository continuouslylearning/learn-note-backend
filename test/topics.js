'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const expect = chai.expect;
const { Model } = require('objection');

chai.use(chaiHttp);

const app = require('../index');
const { dbConnect, dbDisconnect, dbGet, createTables, dropTables } = require('../db');
const { usersData, foldersData, topicsData, resourcesData } = require('./seed');

const { JWT_SECRET, TEST_DB_URI } = require('../config');

const User = require('../models/user');
const Folder = require('../models/folder');
const Topic = require('../models/topic');
const Resource = require('../models/resource');

describe('TOPICS API', async () => {
  const TOPICS_ENDPOINT = '/api/topics';
  const allTopicProperties = ['id', 'title', 'parent', 'notebook', 'resourceOrder', 'createdAt', 'updatedAt'];
  const topicPropertiesWithoutQueryParams = ['id', 'title', 'parent', 'createdAt', 'updatedAt'];
  let user;
  let userId;
  let token;
  let knex;
  let bearerToken;

  before(async function() {
    this.timeout(4000);
    dbConnect(TEST_DB_URI);
    knex = dbGet();
    Model.knex(knex);
    await dropTables(knex);
    await createTables(knex);
  });

  beforeEach(async () => {
    user = await User.query()
      .insert(usersData)
      .returning('*')
      .first();
    userId = user.id;
    token = jwt.sign({ user: user.serialize() }, JWT_SECRET, { subject: user.email });
    bearerToken = `Bearer ${token}`;
    await Folder.query().insert(foldersData);
    await Topic.query().insert(topicsData);
    await knex.raw('SELECT setval(\'topics_id_seq\', (SELECT MAX(id) from "topics"));');
    await knex.raw('SELECT setval(\'folders_id_seq\', (SELECT MAX(id) from "folders"));');
    await knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));');
  });

  afterEach(async () => {
    await Topic.query().delete();
    await Folder.query().delete();
    await User.query().delete();
  });

  after(async () => {
    await dbDisconnect();
  });

  describe('GET /api/topics', async () => {

    it('should return the correct topics', async () => {
      const response = await chai
        .request(app)
        .get(TOPICS_ENDPOINT)
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(200);
      const resTopics = response.body;
      resTopics.forEach(resTopic => {
        expect(resTopic).to.have.keys(topicPropertiesWithoutQueryParams);
        expect(resTopic).to.not.have.keys(['notebook', 'resourceOrder']);
      });

      const dbTopics = await Topic
        .query()
        .where({ userId });

      expect(dbTopics.length).to.equal(resTopics.length);
      dbTopics.forEach((dbTopic, index) => {
        const resTopic = resTopics[index];
        expect(dbTopic.parent).to.equal(resTopic.parent.id);
        expect(dbTopic.title).to.equal(resTopic.title);
        expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
        expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
      }); 
    });

    it('notebooks query argument should return topics with notebook field', async () => {

      const response = await chai
        .request(app)
        .get(TOPICS_ENDPOINT)
        .query({ notebooks: true })
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(200);
      const resTopics = response.body;
      resTopics.forEach(topic => {
        expect(topic).to.contain.keys(topicPropertiesWithoutQueryParams.concat('notebook'));
      });
      
      const dbTopics = await Topic
        .query()
        .where({ userId });

      expect(dbTopics.length).to.equal(resTopics.length);
      dbTopics.forEach((dbTopic, index) => {
        const resTopic = resTopics[index];
        expect(dbTopic.parent).to.equal(resTopic.parent.id);
        expect(dbTopic.title).to.equal(resTopic.title);
        expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
        expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
        expect(JSON.stringify(dbTopic.notebook)).to.equal(JSON.stringify(resTopic.notebook));
      });
    });

    it('resourceOrder query argument should return topics with resourceOrder field', async () => {

      const response = await chai
        .request(app)
        .get(TOPICS_ENDPOINT)
        .query({ resourceOrder: true })
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(200);
      const resTopics = response.body;
      resTopics.forEach(topic => {
        expect(topic).to.include.keys(topicPropertiesWithoutQueryParams.concat('resourceOrder'));
      });
      
      const dbTopics = await Topic
        .query()
        .where({ userId });

      expect(dbTopics.length).to.equal(resTopics.length);
      dbTopics.forEach((dbTopic, index) => {
        const resTopic = resTopics[index];
        expect(dbTopic.parent).to.equal(resTopic.parent.id);
        expect(dbTopic.title).to.equal(resTopic.title);
        expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
        expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
        expect(JSON.stringify(dbTopic.resourceOrder)).to.equal(JSON.stringify(resTopic.resourceOrder));
      });
    });

    it('limit query argument should apply limit to topics', async () => {

      const limit = Math.floor(Math.random()*10);

      const response = await chai
        .request(app)
        .get(TOPICS_ENDPOINT)
        .query({ limit })
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(200);
      const resTopics = response.body;
      resTopics.forEach(topic => {
        expect(topic).to.include.keys(topicPropertiesWithoutQueryParams);
      });
      
      const dbTopics = await Topic
        .query()
        .where({ userId })
        .limit(limit) ;

      expect(dbTopics.length).to.equal(resTopics.length);
      dbTopics.forEach((dbTopic, index) => {
        const resTopic = resTopics[index];
        expect(dbTopic.parent).to.equal(resTopic.parent.id);
        expect(dbTopic.title).to.equal(resTopic.title);
        expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
        expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
      });
    });

    it('should return 401 when JWT is missing', async () => {
      const response = await chai
        .request(app)
        .get(TOPICS_ENDPOINT);

      expect(response).to.have.status(401);
    });

  });

  describe('GET /api/topics/:id', async () => {

    let existingTopic;

    beforeEach(async () => {
      await Resource.query().insert(resourcesData);
      existingTopic = await Topic
        .query()
        .where({ userId })
        .first();
    });

    afterEach(async () => {
      await Resource.query().delete();
    });

    it('should return the correct topic with correct fields', async () => {

      const notebook = {
        'ops': [
          {
            'insert': 'An empty notebook\n'
          }
        ]};

      existingTopic = await Topic
        .query()
        .update({
          notebook: JSON.stringify(notebook)
        })
        .where({ userId, id: existingTopic.id })
        .returning('*')
        .first();

      const dbResources = await Resource
        .query()
        .where({ userId, parent: existingTopic.id });
      
      const res = await chai
        .request(app)
        .get(`${TOPICS_ENDPOINT}/${existingTopic.id}`)
        .set('Authorization', bearerToken);

      const resTopic = res.body;
      expect(res).to.have.status(200);
      expect(resTopic.title).to.equal(existingTopic.title);
      expect(new Date(resTopic.createdAt)).to.deep.equal(new Date(existingTopic.createdAt));
      expect(new Date(resTopic.updatedAt)).to.deep.equal(new Date(existingTopic.updatedAt));
      expect(resTopic.parent.id).to.equal(existingTopic.parent);
      expect(resTopic.notebook).to.deep.equal(existingTopic.notebook);
      expect(resTopic.resources.length).to.equal(dbResources.length);
      
      dbResources.forEach((dbResource, index) => {
        const resResource = res.body.resources[index];
        expect(dbResource.completed).to.equal(resResource.completed);
        expect(new Date(dbResource.lastOpened)).to.deep.equal(new Date(resResource.lastOpened));
        expect(dbResource.title).to.equal(resResource.title);
        expect(dbResource.type).to.equal(resResource.type);
        expect(dbResource.uri).to.equal(resResource.uri);
      });

    });

    it('should return 404 when params id is non-existent', async () => {
      const nonexistentTopicId = Math.floor(Math.random() * 1000000);
      const res = await chai
        .request(app)
        .get(`${TOPICS_ENDPOINT}/${nonexistentTopicId}`)
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(404);
    });

    it('should return 401 when JWT is not provided', async () => {

      const res = await chai
        .request(app)
        .get(`${TOPICS_ENDPOINT}/${existingTopic.id}`);
      
      expect(res).to.have.status(401);
    });

    it('should hide resources when the resources query parameter is set to `false`', async() => {

      const res = await chai
        .request(app)
        .get(`${TOPICS_ENDPOINT}/${existingTopic.id}`)
        .query({ resources: 'false' })
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(200);
      expect(res.body).to.not.have.key('resources');
    });

    it('should hide notebook when the notebook query parameter is set to `false`', async() => {

      const res = await chai
        .request(app)
        .get(`${TOPICS_ENDPOINT}/${existingTopic.id}`)
        .query({ notebook: 'false' })
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(200);
      expect(res.body).to.not.have.key('notebook');
    });

    it('should hide resourceOrder when the resourceOrder query parameter is set to `false`', async() => {

      const res = await chai
        .request(app)
        .get(`${TOPICS_ENDPOINT}/${existingTopic.id}`)
        .query({ notebook: 'false' })
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(200);
      expect(res.body).to.not.have.key('resourceOrder');
    });
  });

  describe('POST /api/topics', async () => {
    const newTopic = {
      title: 'Hash maps',
      notebook: JSON.stringify({
        'ops': [
          {
            'insert': 'An empty notebook\n'
          }
        ]
      })
    };

    it('should insert topic into table when valid parent is given', async () => {
      const res = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .set('Authorization', bearerToken)
        .send(newTopic);
        
      const resTopic = res.body;
      expect(res).to.have.status(201);
      expect(resTopic.parent).to.be.null;
      expect(resTopic).to.have.keys(allTopicProperties);
      expect(resTopic.title).to.equal(newTopic.title);

      const dbTopic = await Topic
        .query()
        .where({ id: resTopic.id, userId })
        .first();

      expect(dbTopic.title).to.equal(resTopic.title);
      expect(dbTopic.parent).to.equal(resTopic.parent);
      expect(dbTopic.notebook).to.deep.equal(resTopic.notebook);
      expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
      expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
    });

    it('should insert topic into table with null value for `parent` when parent isnt provided', async () => {
      const res = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .set('Authorization', bearerToken)
        .send(newTopic);

      const resTopic = res.body;
      const topicId = resTopic.id;
      expect(res).to.have.status(201);
      expect(resTopic.parent).to.be.null;
      expect(resTopic).to.have.keys(allTopicProperties);
      expect(resTopic.title).to.equal(newTopic.title);

      const dbTopic = await Topic
        .query()
        .where({ id: topicId, userId })
        .first();

      expect(dbTopic.title).to.equal(resTopic.title);
      expect(dbTopic.parent).to.equal(resTopic.parent);
      expect(dbTopic.notebook).to.deep.equal(resTopic.notebook);
      expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
      expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
    });

    it('should return 401 when JWT is missing', async () => {
      const res = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send(newTopic);

      expect(res).to.have.status(401);
    });

    it('should return 400 when the parent id is invalid', async () => {
      const parent = Math.floor(Math.max(1000000));
      const topic = {
        title: 'Git',
        parent
      };

      const res = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send(topic)
        .set('Authorization', bearerToken);

      expect(res).to.have.status(400);
    });

    it('should return 400 when title is missing', async () => {
      const parentFolder = await Folder
        .query()
        .where({ userId })
        .first();
      
      const parent = parentFolder.id;
      const requestWithMissingTitle = {
        parent
      };

      const response = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send(requestWithMissingTitle)
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(400);
    });

    it('should return 400 when the title is an empty string', async () => {
      const res = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send({
          title: ' '
        })
        .set('Authorization', bearerToken);

      expect(res).to.have.status(400);
    });

    it('should return 400 for duplicate topic titles', async () => {

      const topicWithSameName = await Topic
        .query()
        .where({ userId })
        .first();
      
      const response = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send({
          title: topicWithSameName.title
        })
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(400);
    });

    it('should return 400 when parent id is a non-integer', async () => {
      const response = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send({
          ...newTopic,
          parent: 'Non-integer parent Id'
        })
        .set('Authorization', bearerToken);

      expect(response).to.have.status(400);
    });

    it('should return 400 when notebook field is not in JSON format', async () => {
      const response = await chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send({
          ...newTopic,
          notebook: 'Non-JSON string'
        })
        .set('Authorization', bearerToken);

      expect(response).to.have.status(400);
    });

    it('should return 400 when notebook field is not a valid Quill JS delta', async () => {

      const response = await chai
        .request(app)
        .post(`${TOPICS_ENDPOINT}`)
        .send({
          ...newTopic,
          notebook: JSON.stringify({
            ops: 'Not an ops array'
          })
        })
        .set('Authorization', bearerToken);
      expect(response).to.have.status(400);
    });
  });

  describe('PUT /api/topics/:id', async () => {
    const updatedTopic = {
      parent: 3001,
      title: 'Angular',
      notebook: JSON.stringify({
        'ops': [
          {
            'insert': 'An empty notebook\n'
          }
        ]
      })
    };

    let topic;

    beforeEach(async () => {
      topic = await Topic
        .query()
        .where({ userId })
        .first();
    });

    it('should update the topic in the table', async () => {
      const res = await chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${topic.id}`)
        .send(updatedTopic)
        .set('Authorization', bearerToken);
   
      const resTopic = res.body;
      expect(res).to.have.status(201);
      expect(resTopic).to.have.keys(allTopicProperties);
      expect(resTopic.title).to.equal(updatedTopic.title);
      expect(resTopic.parent.id).to.equal(updatedTopic.parent);

      const dbTopic = await Topic
        .query()
        .where({ userId, id: topic.id })
        .first();
  
      expect(dbTopic.title).to.equal(updatedTopic.title);
      expect(dbTopic.parent).to.equal(updatedTopic.parent);
      expect(dbTopic.notebook).to.deep.equal(resTopic.notebook);
      expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
      expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
    });

    it('should return 401 when JWT is not provided', async () => {
      const res = await chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${topic.id}`)
        .send(updatedTopic);
      
      expect(res).to.have.status(401);
    });

    it('should return 404 when params id does not exist', async() => {
      const id = Math.floor(Math.random() * 1000000);

      const res = await chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${id}`)
        .send(updatedTopic)
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(404);
    });

    it('should return 400 when parent id is a non-integer', async() => {

      const res = await chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${topic.id}`)
        .send({
          ...updatedTopic,
          parent: 'Non-integer parent id'
        })
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(400);
    });

    it('should return 400 when the title is an empty string', async() => {

      const res = await chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${topic.id}`)
        .send({
          title: ' '
        })
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(400);
    });

    it('should return 400 when the title is a duplicate', async () => {
      
      const topicWithSameName = await Topic
        .query()
        .where({ userId })
        .whereNot({ id: topic.id })
        .first();
      
      const res = await chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${topic.id}`)
        .send({
          title: topicWithSameName.title
        })
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(400);
    });

    it('should return 400 when notebook field is not JSON', async () => {

      const response = await chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${topic.id}`)
        .send({
          ...updatedTopic,
          notebook: 'Not a JSON string'
        })
        .set('Authorization', bearerToken);
      expect(response).to.have.status(400);
    });

    it('should return 400 when notebook field is not a valid Quill JS delta', async () => {

      const response = await chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${topic.id}`)
        .send({
          ...updatedTopic,
          notebook: JSON.stringify({
            ops: 'Not an ops array'
          })
        })
        .set('Authorization', bearerToken);
      expect(response).to.have.status(400);
    });
  });

  describe('DELETE /api/topics/:id', async () => {
    it('should remove the topic from the table', async () => {
      const topic = await Topic
        .query()
        .where({ userId })
        .first();
      
      const topicId = topic.id;

      const res = await chai
        .request(app)
        .delete(`${TOPICS_ENDPOINT}/${topicId}`)
        .set('Authorization', bearerToken);

      expect(res).to.have.status(204);
      
      const topicAfterDeleteRequest = await Topic
        .query()
        .where({ id: topicId, userId })
        .first();

      expect(topicAfterDeleteRequest).to.be.undefined;
    });

    it('should return 401 when JWT is not provided', async () => {
      const topic = await Topic
        .query()
        .where({ userId })
        .first();
      
      const topicId = topic.id;

      const response = await chai
        .request(app)
        .delete(`${TOPICS_ENDPOINT}/${topicId}`);
      
      expect(response).to.have.status(401);
    });

    it('should return 404 when params id does not exist', async () => {
      const id = Math.floor(Math.random() * 1000000);

      const response = await chai
        .request(app)
        .delete(`${TOPICS_ENDPOINT}/${id}`)
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(404);
    });
  });
});


