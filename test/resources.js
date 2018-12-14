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
  let user;
  let userId;
  let token;
  let knex;

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
        return Folder.query().insert(foldersData);
      })
      .then(() => {
        return Topic.query().insert(topicsData);
      })
      .then(() => {
        return Resource.query().insert(resourcesData);
      });
  });

  afterEach(function() {
    return Folder.query()
      .delete()
      .where({})
      .then(() => {
        return User.query().delete();
      })
      .then(() => {
        return Topic.query().delete();
      });
  });

  after(function() {
    return dbDisconnect();
  });

  describe('GET /api/resources', function() {
    it('should return the correct resources', function() {
      let resResources;
      return chai
        .request(app)
        .get(RESOURCES_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          resResources = res.body;
          expect(res).to.have.status(200);
          resResources.forEach(resResource => {
            expect(resResource).to.contain.keys(RESOURCE_PROPERTIES);
          });
          return Resource.query().where({ userId });
        })
        .then(dbResources => {
          expect(dbResources.length).to.equal(resResources.length);
          dbResources.forEach((dbResource, index) => {
            const resResource = resResources[index];
            expect(dbResource.title).to.equal(resResource.title);
            expect(dbResource.parent).to.equal(resResource.parent.id);
            expect(dbResource.type).to.equal(resResource.type);
            expect(dbResource.uri).to.equal(resResource.uri);
            expect(dbResource.completed).to.equal(resResource.completed);
            expect(new Date(dbResource.lastOpened)).to.deep.equal(new Date(resResource.lastOpened));
          });
        });
    });

    it('should return the correct resources with query arguments', function() {
      let resResources;
      return chai
        .request(app)
        .get(RESOURCES_ENDPOINT)
        .query({ limit: 5, orderBy: 'lastOpened' })
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          resResources = res.body;
          expect(res).to.have.status(200);
          resResources.forEach(resResource => {
            expect(resResource).to.contain.keys(RESOURCE_PROPERTIES);
          });
          return Resource.query()
            .where({ userId })
            .limit(5)
            .orderBy('lastOpened', 'desc');
        })
        .then(dbResources => {
          expect(dbResources.length).to.equal(resResources.length);
          for (let i = 0; i < dbResources.length; i++) {
            expect(dbResources[i].title).to.equal(resResources[i].title);
          }
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
  });

  describe('GET /api/resources/:id', function() {
    it('should return the correct resources', function() {
      let resResource;
      let resourceId;
      return Resource.query()
        .where({ userId })
        .first()
        .then(resource => {
          console.log(resource);
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

    it('should return 422 when the parent id is invalid', function() {
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
          expect(res).to.have.status(422);
        });
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
            .set('Authorization', `Bearer ${token}`);
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
