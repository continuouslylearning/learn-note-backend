'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const { Model } = require('objection');
chai.use(chaiHttp);
const app = require('../index');
const { dbConnect, dbDisconnect, dbGet, createTables, dropTables } = require('../db');
const { usersData } = require('./seed');
const { TEST_DB_URI } = require('../config');
const User = require('../models/user');


describe('USERS ENDPOINT', function(){
  const USER_ENDPOINT = '/api/users';
  let knex;

  before(function(){
    this.timeout(4000);
    dbConnect(TEST_DB_URI);
    knex = dbGet();
    Model.knex(knex);
    return Promise.all(usersData.map(user => User.hashPassword(user.password)))
      .then(hashes => {
        usersData.forEach((user, index) => {
          user.password = hashes[index];
        });
      })
      .then(() => dropTables(knex))
      .then(() => createTables(knex));
  });

  this.beforeEach(function(){
    return User
      .query()
      .insert(usersData);
  });

  afterEach(function(){
    return User
      .query()
      .delete();
  });

  after(function(){
    return dbDisconnect();
  });

  describe('POST /api/users', function(){
    const newUser = {
      email: 'user@gmail.com',
      name: 'Anonymous',
      password: 'password'
    };

    it('should create a new user', function(){
      return chai.request(app)
        .post(USER_ENDPOINT)
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(201);
          const userId = res.body.id;
          return User
            .query()
            .where({ id: userId })
            .first();
        })
        .then(user => {
          expect(user.email).to.equal(newUser.email);
          expect(user.name).to.equal(newUser.name);
          return user.validatePassword(newUser.password);
        })
        .then(passwordIsValid => {
          expect(passwordIsValid).to.be.true;
        });
    });

    it('should return 400 when username is missing', function(){
      return chai.request(app)
        .post(USER_ENDPOINT)
        .send({ password: newUser.password, name: newUser.name })
        .then(res => {
          expect(res).to.have.status(400);
        });
    });
    
    it('should return 400 when password is missing', function(){
      return chai.request(app)
        .post(USER_ENDPOINT)
        .send({ email: newUser.email, name: newUser.name })
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('should reject duplicate emails', function(){
      return User
        .query()
        .first()
        .then(user => {
          const existingEmail = user.email;
          return chai.request(app)
            .post(USER_ENDPOINT)
            .send({ ...newUser, email: existingEmail });
        })
        .then(res => {
          expect(res).to.have.status(422);
        });
    });

    it('should return 422 when password is less than 8 characters', function(){
      return chai.request(app)
        .post(USER_ENDPOINT)
        .send({ ...newUser, password: newUser.password.slice(0, 7)})
        .then(res => {
          expect(res).to.have.status(422);
        });
    });

    it('should return 422 when email is invalid', function(){
      return chai.request(app)
        .post(USER_ENDPOINT)
        .send({ ...newUser, email: 'invalid_email' })
        .then(res => {
          expect(res).to.have.status(422);
        });
    });

  });
});