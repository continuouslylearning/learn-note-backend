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

describe('RESOURCES API', async () => {
  const RESOURCES_ENDPOINT = '/api/resources';
  const RESOURCE_PROPERTIES = ['id', 'title', 'parent', 'uri', 'type', 'completed', 'lastOpened'];
  let bearerToken;
  let user;
  let userId;
  let token;
  let knex;

  before(async function() {
    this.timeout(5000);
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
    await Resource.query().insert(resourcesData);
    await knex.raw('SELECT setval(\'resources_id_seq\', (SELECT MAX(id) from "resources"));');
    await knex.raw('SELECT setval(\'topics_id_seq\', (SELECT MAX(id) from "topics"));');
    await knex.raw('SELECT setval(\'folders_id_seq\', (SELECT MAX(id) from "folders"));');
    await knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));');
  });

  afterEach(async () => {
    await Resource.query().delete();
    await Topic.query().delete();
    await Folder.query().delete();
    await User.query().delete();
  });

  after(async () => {
    await dbDisconnect();
  });

  describe('GET /api/resources', async () => {

    it('should return the correct resources', async () => {

      const response = await chai
        .request(app)
        .get(RESOURCES_ENDPOINT)
        .set('Authorization', bearerToken);

      expect(response).to.have.status(200);
      const resResources = response.body;
      resResources.forEach(resResource => {
        expect(resResource).to.contain.keys(RESOURCE_PROPERTIES);
      });

      const dbResources = await Resource
        .query()
        .where({ userId });
      
      resResources.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
      dbResources.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
      expect(dbResources.length).to.equal(resResources.length);
      dbResources.forEach((dbResource, index) => {
        const resResource = resResources[index];
        expect(dbResource.parent).to.equal(resResource.parent.id);
        expect(dbResource.title).to.equal(resResource.title);
        expect(dbResource.type).to.equal(resResource.type);
        expect(dbResource.uri).to.equal(resResource.uri);
        expect(dbResource.completed).to.equal(resResource.completed);
        expect(new Date(dbResource.lastOpened)).to.deep.equal(new Date(resResource.lastOpened));
      });
    });

    it('should return the correct resources with query arguments', async () => {

      const response = await chai
        .request(app)
        .get(RESOURCES_ENDPOINT)
        .query({ limit: 5, orderBy: 'lastOpened' })
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(200);
      const resResources = response.body;
      resResources.forEach(resResource => {
        expect(resResource).to.contain.keys(RESOURCE_PROPERTIES);
      });

      const dbResources = await Resource
        .query()
        .where({ userId })
        .limit(5)
        .orderBy('lastOpened', 'desc');

      dbResources.forEach((dbResource, index) => {
        const resResource = resResources[index];
        expect(dbResource.parent).to.equal(resResource.parent.id);
        expect(dbResource.title).to.equal(resResource.title);
        expect(dbResource.type).to.equal(resResource.type);
        expect(dbResource.uri).to.equal(resResource.uri);
        expect(dbResource.completed).to.equal(resResource.completed);
        expect(new Date(dbResource.lastOpened)).to.deep.equal(new Date(resResource.lastOpened));
      });
    });

    it('should return 401 when JWT is missing', async () => {
      const response = await chai
        .request(app)
        .get(RESOURCES_ENDPOINT);

      expect(response).to.have.status(401);
    });
  });

  describe('GET /api/resources/:id', async () => {
    it('should return the correct resources', async () => {

      let dbResource = await Resource
        .query()
        .where({ userId })
        .first();
    
      const res = await chai
        .request(app)
        .get(`${RESOURCES_ENDPOINT}/${dbResource.id}`)
        .set('Authorization', bearerToken);
      
      dbResource = await Resource
        .query()
        .where({ userId, id: dbResource.id })
        .first();

      const resResource = res.body;
      expect(res).to.have.status(200);
      expect(resResource).to.contain.keys(RESOURCE_PROPERTIES);
      expect(resResource.completed).to.equal(dbResource.completed);
      expect(new Date(resResource.lastOpened)).to.deep.equal(new Date(dbResource.lastOpened));
      expect(resResource.parent.id).to.equal(dbResource.parent);
      expect(resResource.title).to.equal(dbResource.title);
      expect(resResource.type).to.equal(dbResource.type);
      expect(resResource.uri).to.equal(dbResource.uri);
    });

    it('should return 401 when JWT is missing', async () => {
      const res = await chai
        .request(app)
        .get(RESOURCES_ENDPOINT);
      
      expect(res).to.have.status(401);
    });

    it('should return 404 when the topic id is non-existent', async () => {
      const topicId = Math.floor(Math.random() * 100000);

      const res = await chai
        .request(app)
        .get(`${RESOURCES_ENDPOINT}/${topicId}`)
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(404);
    });
  });

  describe('POST /api/resources', async () => {
    const newResource = {
      title: 'Resource title',
      parent: 4000,
      uri: 'https://www.youtube.com/watch?v=vEROU2XtPR8',
      type: 'youtube'
    };

    beforeEach(async() => {
      newResource.parent = (await Topic
        .query()
        .select('id')
        .where({ userId })
        .first()
      ).id;
    });

    it('should insert topic into table when valid parent is given', async () => {
      const res = await chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .set('Authorization', bearerToken)
        .send(newResource);
      
      const resResource = res.body;
      const resourceId = resResource.id;
      expect(res).to.have.status(201);
      expect(resResource).to.have.keys(RESOURCE_PROPERTIES);
      expect(resResource.parent).to.equal(newResource.parent);
      expect(resResource.title).to.equal(newResource.title);
      expect(resResource.type).to.equal(resResource.type);
      expect(resResource.uri).to.equal(
        newResource.type === 'youtube' ? newResource.uri.split('v=')[1].slice(0, 11) : newResource.uri
      );
      
      const dbResource = await Resource
        .query()
        .where({ id: resourceId })
        .first();

      expect(dbResource.title).to.equal(resResource.title);
      expect(dbResource.parent).to.equal(resResource.parent);
      expect(dbResource.type).to.equal(resResource.type);
      expect(dbResource.uri).to.equal(
        newResource.type === 'youtube' ? newResource.uri.split('v=')[1].slice(0, 11) : newResource.uri
      );
      expect(dbResource.completed).to.equal(resResource.completed);
      expect(new Date(dbResource.lastOpened)).to.deep.equal(new Date(resResource.lastOpened));
    });

    it('should return 401 when JWT is missing', async () => {
      const res = await chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send(newResource);

      expect(res).to.have.status(401);
    });

    it('should return 400 when the parent id is invalid', async () => {
      const parent = Math.floor(Math.max(1000000));
      const resource = {
        title: 'Resource title',
        parent,
        uri: 'https://www.youtube.com/watch?v=vEROU2XtPR8',
        type: 'youtube'
      };

      const res = await chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send(resource)
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(400);
    });

    it('should return 400 for duplicate resource title within the same topic', async () => {
      const resourceWithDuplicatedTitle = await Resource
        .query()
        .where({ userId, parent: newResource.parent })
        .first();
      
      const res = await chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send({ 
          ...newResource, 
          title: resourceWithDuplicatedTitle.title
        })
        .set('Authorization', bearerToken);

      expect(res).to.have.status(400);
    });

    it('should return 201 for duplicate resource title not within the same topic', async () => {
      const resourceWithDuplicatedTitle = await Resource
        .query()
        .where({ userId })
        .whereNot({ parent: newResource.parent })
        .first();
      
      const res = await chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send({ 
          ...newResource, 
          title: resourceWithDuplicatedTitle.title
        })
        .set('Authorization', bearerToken);

      expect(res).to.have.status(201);
    });

    it('should return 400 when title field is missing', async () => {
      const res = await chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send({ 
          parent: 4000,
          uri: 'https://www.youtube.com/watch?v=vEROU2XtPR8',
          type: 'youtube'
        })
        .set('Authorization', bearerToken);
      expect(res).to.have.status(400);
    });

    it('should return 400 when uri is missing', async () => {
      const res = await chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send({ 
          title: 'Resource title',
          parent: 4000,
          type: 'other'
        })
        .set('Authorization', bearerToken);
      expect(res).to.have.status(400);
    });

    it('should return 400 when parent field is missing', async () => {
      const res = await chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send({ 
          title: 'Resource title',
          uri: 'https://www.youtube.com/watch?v=vEROU2XtPR8',
          type: 'other'
        })
        .set('Authorization', bearerToken);
      expect(res).to.have.status(400);
    });
  });

  describe('PUT /api/resources/:id', async () => {
  
    const updatedResource = {
      title: 'New Resource Title',
      lastOpened: (new Date()).toISOString(),
      completed: true
    };

    it('should update the resource in the table', async () =>  {

      const existingResource = await Resource
        .query()
        .where({ userId })
        .first();

      const resourceId = existingResource.id;

      const response = await chai
        .request(app)
        .put(`${RESOURCES_ENDPOINT}/${resourceId}`)
        .send(updatedResource)
        .set('Authorization', bearerToken);

      const resResource = response.body;
      expect(response).to.have.status(201);
      expect(resResource).to.have.keys(RESOURCE_PROPERTIES);
      expect(resResource.completed).to.equal(updatedResource.completed);
      expect(resResource.lastOpened).to.equal(updatedResource.lastOpened);
      expect(resResource.title).to.equal(updatedResource.title);

      const dbResource = await Resource
        .query()
        .where({ userId, id: resourceId })
        .first();

      expect(dbResource.title).to.equal(updatedResource.title);
      expect(new Date(dbResource.lastOpened)).to.deep.equal(new Date(updatedResource.lastOpened));
      expect(dbResource.completed).to.equal(resResource.completed);
      expect(dbResource.parent).to.equal(resResource.parent && resResource.parent.id);
      expect(dbResource.type).to.equal(resResource.type);
      expect(dbResource.uri).to.equal(resResource.uri);
    });

    it('should return 401 when JWT is not provided', async () => {

      const existingResource = await Resource
        .query()
        .where({ userId })
        .first();
      
      const resourceId = existingResource.id;

      const response = await chai
        .request(app)
        .put(`${RESOURCES_ENDPOINT}/${resourceId}`)
        .send(updatedResource);
      
      expect(response).to.have.status(401);
    });

    it('should return 404 when params id does not exist', async () => {
      const id = Math.floor(Math.random() * 1000000);

      const response = await chai
        .request(app)
        .put(`${RESOURCES_ENDPOINT}/${id}`)
        .send(updatedResource)
        .set('Authorization', bearerToken);

      expect(response).to.have.status(404);
    });

    it('should reject requests with duplicate resource titles within same topic', async () => {
      
      const existingResource = await Resource
        .query()
        .where({ userId })
        .first();

      const id = existingResource.id;
      const parentTopicId = existingResource.parent;

      const secondResource = await Resource
        .query()
        .where({ userId, parent: parentTopicId })
        .whereNot({ id })
        .first();
      
      const titleOfSecondResource = secondResource.title;

      const updateWithDuplicateTitle = {
        title: titleOfSecondResource,
        lastOpened: new Date()
      };

      const response = await chai
        .request(app)
        .put(`${RESOURCES_ENDPOINT}/${id}`)
        .send(updateWithDuplicateTitle)
        .set('Authorization', bearerToken);

      expect(response).to.have.status(400);

    });

    it('should not reject requests with duplicate resource titles not within the same topic', async () => {
      
      const existingResource = await Resource
        .query()
        .where({ userId })
        .first();

      const id = existingResource.id;
      const parentTopicId = existingResource.parent;

      const secondResource = await Resource
        .query()
        .where({ userId })
        .whereNot({ id, parent: parentTopicId })
        .first();
      
      const titleOfSecondResource = secondResource.title;

      const updateWithDuplicateTitle = {
        title: titleOfSecondResource,
        lastOpened: new Date(),
        completed: true
      };

      const response = await chai
        .request(app)
        .put(`${RESOURCES_ENDPOINT}/${id}`)
        .send(updateWithDuplicateTitle)
        .set('Authorization', bearerToken);

      expect(response).to.have.status(201);

    });
  });

  describe('DELETE /api/resources/:id', async () => {
    it('should remove the resources from the table', async () => {
      const existingResource = await Resource
        .query()
        .where({ userId })
        .first();

      const res = await chai
        .request(app)
        .delete(`${RESOURCES_ENDPOINT}/${existingResource.id}`)
        .set('Authorization', bearerToken);

      const resourceAfterDeleteRequest = await Resource
        .query()
        .where({ userId, id: existingResource.id })
        .first();
      
      expect(res).to.have.status(204);
      expect(resourceAfterDeleteRequest).to.be.undefined;
    });

    it('should return 401 when JWT is not provided', async () => {
      const existingResource = await Resource
        .query()
        .where({ userId })
        .first();
    
      const res = await chai
        .request(app)
        .delete(`${RESOURCES_ENDPOINT}/${existingResource.id}`);
      
      expect(res).to.have.status(401);
    });

    it('should return 404 when params id does not exist', async () => {
      const id = Math.floor(Math.random() * 1000000);

      const res = await chai
        .request(app)
        .delete(`${RESOURCES_ENDPOINT}/${id}`)
        .set('Authorization', bearerToken);

      expect(res).to.have.status(404);
    });
  });
});
