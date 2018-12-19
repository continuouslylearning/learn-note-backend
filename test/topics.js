'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const expect = chai.expect;
const { Model } = require('objection');

chai.use(chaiHttp);

const app = require('../index');
const { dbConnect, dbDisconnect, dbGet, createTables, dropTables } = require('../db');
const { usersData, foldersData, topicsData } = require('./seed');

const { JWT_SECRET, TEST_DB_URI } = require('../config');

const User = require('../models/user');
const Folder = require('../models/folder');
const Topic = require('../models/topic');

describe.only('TOPICS API', function() {
  const TOPICS_ENDPOINT = '/api/topics';
  const allTopicProperties = ['id', 'title', 'parent', 'notebook', 'resourceOrder', 'createdAt', 'updatedAt'];
  const topicPropertiesWithoutQueryParams = ['id', 'title', 'parent', 'createdAt', 'updatedAt'];
  let user;
  let userId;
  let token;
  let knex;
  let bearerToken;

  before(function() {
    this.timeout(4000);
    dbConnect(TEST_DB_URI);
    knex = dbGet();
    Model.knex(knex);
    return dropTables(knex).then(() => createTables(knex));
  });

  beforeEach(function() {
    return User.query()
      .insert(usersData)
      .returning('*')
      .first()
      .then(_user => {
        user = _user;
        userId = user.id;
        token = jwt.sign({ user: user.serialize() }, JWT_SECRET, { subject: user.email });
        bearerToken = `Bearer ${token}`;
        return Folder.query().insert(foldersData);
      })
      .then(() => Topic.query().insert(topicsData))
      .then(() => knex.raw('SELECT setval(\'topics_id_seq\', (SELECT MAX(id) from "topics"));'))
      .then(() => knex.raw('SELECT setval(\'folders_id_seq\', (SELECT MAX(id) from "folders"));'))
      .then(() => knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));'));
  });

  afterEach(function() {
    return Topic.query().delete()
      .then(() => Folder.query().delete())
      .then(() => User.query().delete());
  });

  after(function() {
    return dbDisconnect();
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

    it('should return topics with notebook fields with notebooks query argument', async () => {

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

    it('should return topics with resourceOrder fields with resourceOrder query argument', async () => {

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

    it('should return 401 when JWT is missing', async () => {
      const response = await chai
        .request(app)
        .get(TOPICS_ENDPOINT);

      expect(response).to.have.status(401);
    });

  });

  describe('POST /api/topics', function() {
    const newTopic = {
      title: 'Hash maps'
    };

    it('should insert topic into table when valid parent is given', function() {
      let resTopic;

      return chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(newTopic)
        .then(res => {
          resTopic = res.body;
          const topicId = resTopic.id;
          expect(res).to.have.status(201);
          expect(resTopic.parent).to.be.null;
          expect(resTopic).to.have.keys(allTopicProperties);
          expect(resTopic.title).to.equal(newTopic.title);
          return Topic.query()
            .where({ id: topicId, userId })
            .first();
        })
        .then(dbTopic => {
          expect(dbTopic.title).to.equal(resTopic.title);
          expect(dbTopic.parent).to.equal(resTopic.parent);
          expect(dbTopic.notebook).to.equal(resTopic.notebook);
          expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
          expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
        });
    });

    it('should insert topic into table with null value for `parent` when parent isnt provided', function() {
      let resTopic;

      return chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(newTopic)
        .then(res => {
          resTopic = res.body;
          const topicId = resTopic.id;
          expect(res).to.have.status(201);
          expect(resTopic.parent).to.be.null;
          expect(resTopic).to.have.keys(allTopicProperties);
          expect(resTopic.title).to.equal(newTopic.title);
          return Topic.query()
            .where({ id: topicId, userId })
            .first();
        })
        .then(dbTopic => {
          expect(dbTopic.title).to.equal(resTopic.title);
          expect(dbTopic.parent).to.equal(resTopic.parent);
          expect(dbTopic.notebook).to.equal(resTopic.notebook);
          expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
          expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
        });
    });

    it('should return 401 when JWT is missing', function() {
      return chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send(newTopic)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 400 when the parent id is invalid', function() {
      const parent = Math.floor(Math.max(1000000));
      const topic = {
        title: 'Git',
        parent
      };

      return chai
        .request(app)
        .post(TOPICS_ENDPOINT)
        .send(topic)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
        });
    });
  });

  describe('PUT /api/topics/:id', function() {
    const updatedTopic = {
      parent: 3001,
      title: 'Angular',
      notebook: '[{ "insert": "value", "insert": "value2"}]'
    };

    it('should update the topic in the table', function() {
      let resTopic;
      let topicId;
      return Topic.query()
        .where({ userId })
        .first()
        .then(topic => {
          topicId = topic.id;
          return chai
            .request(app)
            .put(`${TOPICS_ENDPOINT}/${topicId}`)
            .send(updatedTopic)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          resTopic = res.body;
          expect(res).to.have.status(201);
          expect(resTopic).to.have.keys(allTopicProperties);
          expect(resTopic.title).to.equal(updatedTopic.title);
          expect(resTopic.parent.id).to.equal(updatedTopic.parent);
          return Topic.query()
            .where({ userId, id: topicId })
            .first();
        })
        .then(dbTopic => {
          expect(dbTopic.title).to.equal(updatedTopic.title);
          expect(dbTopic.parent).to.equal(updatedTopic.parent);
          expect(dbTopic.notebook).to.deep.equal(resTopic.notebook);
          expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
          expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
        });
    });

    it('should return 401 when JWT is not provided', function() {
      return Topic.query()
        .where({ userId })
        .first()
        .then(topic => {
          const topicId = topic.id;
          return chai
            .request(app)
            .put(`${TOPICS_ENDPOINT}/${topicId}`)
            .send(updatedTopic);
        })
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 404 when params id does not exist', function() {
      const id = Math.floor(Math.random() * 1000000);

      return chai
        .request(app)
        .put(`${TOPICS_ENDPOINT}/${id}`)
        .send(updatedTopic)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('DELETE /api/topics/:id', function() {
    it('should remove the topic from the table', function() {
      let topicId;
      return Topic.query()
        .where({ userId })
        .first()
        .then(topic => {
          topicId = topic.id;
          return chai
            .request(app)
            .delete(`${TOPICS_ENDPOINT}/${topicId}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Topic.query()
            .where({ id: topicId, userId })
            .first();
        })
        .then(topic => {
          expect(topic).to.be.undefined;
        });
    });

    it('should return 401 when JWT is not provided', function() {
      return Topic.query()
        .where({ userId })
        .first()
        .then(topic => {
          const topicId = topic.id;
          return chai.request(app).delete(`${TOPICS_ENDPOINT}/${topicId}`);
        })
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 404 when params id does not exist', function() {
      const id = Math.floor(Math.random() * 1000000);

      return chai
        .request(app)
        .delete(`${TOPICS_ENDPOINT}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });
});
