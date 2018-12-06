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


describe('TOPICS API', function(){

  const TOPICS_ENDPOINT = '/api/topics';
  const TOPIC_PROPERTIES = ['id', 'title', 'parent', 'userId', 'notebook', 'resourceOrder', 'lastOpened', 'createdAt', 'updatedAt'];
  let user;
  let userId;
  let token;
  let knex;

  before(function(){
    this.timeout(4000);
    dbConnect(TEST_DB_URI);
    knex = dbGet();
    Model.knex(knex);
    return dropTables(knex)
      .then(() => createTables(knex));
  });

  beforeEach(function(){
    return User
      .query()
      .insert(usersData)
      .returning('*')
      .first()
      .then(_user=> {
        user = _user;
        userId = user.id;
        token = jwt.sign({ user: user.serialize() }, JWT_SECRET, { subject: user.email });
        return Folder
          .query()
          .insert(foldersData);
      })
      .then(() => {
        return Topic
          .query()
          .insert(topicsData);
      });
  });

  afterEach(function(){
    return Folder
      .query()
      .delete()
      .where({})
      .then(() => {
        return User
          .query()
          .delete();
      })
      .then(() => {
        return Topic
          .query()
          .delete();
      });
  });

  after(function(){
    return dbDisconnect();
  });

  describe('GET /api/topics', function(){
  });

  describe('POST /api/topics', function(){
    const newTopic = {
      title: 'Hash maps'
    };

    it('should insert topic into table when valid parent is given', function(){

      let resTopic;

      return chai.request(app)
        .post(TOPICS_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(newTopic)
        .then(res => {
          resTopic = res.body;
          const topicId = resTopic.id;
          expect(res).to.have.status(201);
          expect(resTopic.parent).to.be.null;
          expect(resTopic).to.have.keys(TOPIC_PROPERTIES);
          expect(resTopic.title).to.equal(newTopic.title);
          return Topic
            .query()
            .where({ id: topicId, userId })
            .first();
        })
        .then(dbTopic => {
          expect(dbTopic.title).to.equal(resTopic.title);
          expect(dbTopic.parent).to.equal(resTopic.parent);
          expect(dbTopic.notebook).to.equal(resTopic.notebook);
          expect(new Date(dbTopic.lastOpened)).to.deep.equal(new Date(resTopic.lastOpened));
          expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
          expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
        });
    });


    it('should insert topic into table with null value for `parent` when parent isnt provided', function(){

      let resTopic;

      return chai.request(app)
        .post(TOPICS_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .send(newTopic)
        .then(res => {
          resTopic = res.body;
          const topicId = resTopic.id;
          expect(res).to.have.status(201);
          expect(resTopic.parent).to.be.null;
          expect(resTopic).to.have.keys(TOPIC_PROPERTIES);
          expect(resTopic.title).to.equal(newTopic.title);
          return Topic
            .query()
            .where({ id: topicId, userId })
            .first();
        })
        .then(dbTopic => {
          expect(dbTopic.title).to.equal(resTopic.title);
          expect(dbTopic.parent).to.equal(resTopic.parent);
          expect(dbTopic.notebook).to.equal(resTopic.notebook);
          expect(new Date(dbTopic.lastOpened)).to.deep.equal(new Date(resTopic.lastOpened));
          expect(new Date(dbTopic.createdAt)).to.deep.equal(new Date(resTopic.createdAt));
          expect(new Date(dbTopic.updatedAt)).to.deep.equal(new Date(resTopic.updatedAt));
        });
    });

    it('should return 401 when JWT is missing', function(){

      return chai.request(app)
        .post(TOPICS_ENDPOINT)
        .send(newTopic)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 422 when the parent id is invalid', function(){

      const parent = Math.floor(Math.max(1000000));
      const topic = {
        title: 'Git',
        parent
      };

      return chai.request(app)
        .post(TOPICS_ENDPOINT)
        .send(topic)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(422);
        });
    });
  });

  describe('PUT /api/topics/:id', function(){
  });

  describe('DELETE /api/topics/:id', function(){
  });


});