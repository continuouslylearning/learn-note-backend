'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const expect = chai.expect;
const { Model } = require('objection');

chai.use(chaiHttp);

const app = require('../index');
const { dbConnect, dbDisconnect, dbGet, createTables, dropTables } = require('../db');
const { usersData } = require('./seed');

const { JWT_SECRET, TEST_DB_URI } = require('../config');

const User = require('../models/user');

describe('AUTH ENDPOINT', function(){

  const AUTH_ENDPOINT = '/auth';
  let user;
  let token;
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

  beforeEach(function(){
    return User
      .query()
      .insert(usersData)
      .returning('*')
      .first()
      .then(_user=> {
        user = _user;
        token = jwt.sign({ user: user.serialize() }, JWT_SECRET, { subject: user.email });
      });
  });

  afterEach(function(){
    return User
      .query()
      .delete();
  });

  after(function(){
    return dbDisconnect();
  });

  describe('POST /auth/login', function(){
    const newUser = {
      email: 'user@gmail.com',
      name: 'Anonymous',
      password: 'password'
    };

    beforeEach(function(){

      return chai.request(app)
        .post('/api/users')
        .send(newUser);
    });

    it('should return a valid JWT', function(){
      return chai.request(app)
        .post(`${AUTH_ENDPOINT}/login`)
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.contain.key('authToken');
          const authToken = res.body.authToken;

          return new Promise(resolve => {
            jwt.verify(authToken, JWT_SECRET, err => {
              if(err) return resolve(false);
              resolve(true);
            });
          });
        })
        .then(jwtIsValid => {
          expect(jwtIsValid).to.be.true;
        });
    });

    it('should return 401 when email is invalid', function(){
      return chai.request(app)
        .post(`${AUTH_ENDPOINT}/login`)
        .send({ ...newUser, email: 'incorrectemail@gmail.com'})
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 401 when password is invalid', function(){
      return chai.request(app)
        .post(`${AUTH_ENDPOINT}/login`)
        .send({ ...newUser, password: 'incorrect_password'})
        .then(res => {
          expect(res).to.have.status(401);
        });
    });
  });

  describe('POST /api/refresh', function(){
    
    it('should return a valid JWT', function(){
      return chai.request(app)
        .post(`${AUTH_ENDPOINT}/refresh`)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.contain.key('authToken');
          const authToken = res.body.authToken;
          return new Promise(resolve => {
            jwt.verify(authToken, JWT_SECRET, err => {
              if(err) return resolve(false);
              return resolve(true);
            });
          });
        })
        .then(jwtisValid => {
          expect(jwtisValid).to.be.true;
        });
    });

    it('should return 401 when request JWT is invalid', function(){
      const invalidToken = 'INVALIDTOKEN';
      return chai.request(app)
        .post(`${AUTH_ENDPOINT}/refresh`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 401 when request JWT is missing', function(){

      return chai.request(app)
        .post(`${AUTH_ENDPOINT}/refresh`)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });
  });
});