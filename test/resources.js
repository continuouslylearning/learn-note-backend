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

describe('RESOURCES API', function() {
  const RESOURCES_ENDPOINT = '/api/resources';
  const RESOURCE_PROPERTIES = ['id', 'title', 'parent', 'uri', 'type', 'completed', 'lastOpened'];
  let bearerToken;
  let user;
  let userId;
  let token;
  let knex;

  before(function() {
    this.timeout(10000);
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
      .then(() => Resource.query().insert(resourcesData))
      .then(() => knex.raw('SELECT setval(\'resources_id_seq\', (SELECT MAX(id) from "resources"));'))
      .then(() => knex.raw('SELECT setval(\'topics_id_seq\', (SELECT MAX(id) from "topics"));'))
      .then(() => knex.raw('SELECT setval(\'folders_id_seq\', (SELECT MAX(id) from "folders"));'))
      .then(() => knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));'));
  });

  afterEach(function() {
    return Resource.query()
      .delete()
      .where({})
      .then(() => Topic.query().delete())
      .then(() => Folder.query().delete())
      .then(() => User.query().delete());
  });

  after(function() {
    return dbDisconnect();
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

  describe('GET /api/resources/:id', function() {
    it('should return the correct resources', function() {
      let resResource;
      let resourceId;
      return Resource.query()
        .where({ userId })
        .first()
        .then(resource => {
          resourceId = resource.id;
          return chai
            .request(app)
            .get(`${RESOURCES_ENDPOINT}/${resourceId}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          resResource = res.body;
          expect(resResource).to.contain.keys(RESOURCE_PROPERTIES);
        });
    });

    it('should return 401 when JWT is missing', function() {
      return chai
        .request(app)
        .get(RESOURCES_ENDPOINT)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 404 when the topic id is non-existent', function() {
      const topicId = Math.floor(Math.random() * 100000);

      return chai
        .request(app)
        .get(`${RESOURCES_ENDPOINT}/${topicId}`)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/resources', function() {
    const newResource = {
      title: 'Resource title',
      parent: 4000,
      uri: 'https://www.youtube.com/watch?v=vEROU2XtPR8',
      userId,
      type: 'youtube'
    };

    it('should insert topic into table when valid parent is given', function() {
      let resResource;

      return chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(newResource)
        .then(res => {
          resResource = res.body;
          const resourceId = resResource.id;
          expect(res).to.have.status(201);
          expect(resResource).to.have.keys(RESOURCE_PROPERTIES);
          expect(resResource.parent).to.equal(newResource.parent);
          expect(resResource.title).to.equal(newResource.title);
          expect(resResource.type).to.equal(resResource.type);
          expect(resResource.uri).to.equal(
            newResource.type === 'youtube' ? newResource.uri.split('v=')[1].slice(0, 11) : newResource.uri
          );
          return Resource.query()
            .where({ id: resourceId })
            .first();
        })
        .then(dbResource => {
          expect(dbResource.title).to.equal(resResource.title);
          expect(dbResource.parent).to.equal(resResource.parent);
          expect(dbResource.type).to.equal(resResource.type);
          expect(dbResource.uri).to.equal(
            newResource.type === 'youtube' ? newResource.uri.split('v=')[1].slice(0, 11) : newResource.uri
          );
          expect(dbResource.completed).to.equal(resResource.completed);
          expect(new Date(dbResource.lastOpened)).to.deep.equal(new Date(resResource.lastOpened));
        });
    });

    it('should return 401 when JWT is missing', function() {
      return chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send(newResource)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 400 when the parent id is invalid', function() {
      const parent = Math.floor(Math.max(1000000));
      const resource = {
        title: 'Resource title',
        parent,
        uri: 'https://www.youtube.com/watch?v=vEROU2XtPR8',
        type: 'youtube'
      };

      return chai
        .request(app)
        .post(RESOURCES_ENDPOINT)
        .send(resource)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
        });
    });
  });

  describe('PUT /api/resources/:id', function() {
  
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

  describe('DELETE /api/resources/:id', function() {
    it('should remove the resources from the table', function() {
      let resourceId;
      return Resource.query()
        .where({ userId })
        .first()
        .then(resource => {
          resourceId = resource.id;
          return chai
            .request(app)
            .delete(`${RESOURCES_ENDPOINT}/${resourceId}`)
            .set('Authorization', bearerToken);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Resource.query()
            .where({ userId, id: resourceId })
            .first();
        })
        .then(resource => {
          expect(resource).to.be.undefined;
        });
    });

    it('should return 401 when JWT is not provided', function() {
      return Resource.query()
        .where({ userId })
        .first()
        .then(resource => {
          const resourceId = resource.id;
          return chai.request(app).delete(`${RESOURCES_ENDPOINT}/${resourceId}`);
        })
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 404 when params id does not exist', function() {
      const id = Math.floor(Math.random() * 1000000);

      return chai
        .request(app)
        .delete(`${RESOURCES_ENDPOINT}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });
});
