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


describe('USERS ENDPOINT', async () => {
  const USER_ENDPOINT = '/api/users';
  let knex;

  before(async function(){
    this.timeout(4000);
    dbConnect(TEST_DB_URI);
    knex = dbGet();
    Model.knex(knex);
    const hashes = await Promise.all(usersData.map(user => User.hashPassword(user.password)));
    usersData.forEach((user, index) => {
      user.password = hashes[index];
    });
    await dropTables(knex);
    await createTables(knex);
  });

  beforeEach(async () => {
    await User
      .query()
      .insert(usersData);
  });

  afterEach(async () => {
    await User
      .query()
      .delete();
  });

  after(async () => {
    await dbDisconnect();
  });

  describe('POST /api/users', async () => {
    const newUser = {
      email: 'user@gmail.com',
      name: 'Anonymous',
      password: 'password'
    };

    it('should create a new user', async () => {
      const res = await chai
        .request(app)
        .post(USER_ENDPOINT)
        .send(newUser);

      const userId = res.body.id;
      const user = await User
        .query()
        .where({ id: userId })
        .first();

      const passwordIsValid = await user.validatePassword(newUser.password);
     
      expect(res).to.have.status(201);
      expect(user.email).to.equal(newUser.email);
      expect(user.name).to.equal(newUser.name);
      expect(passwordIsValid).to.be.true;
    });

    it('should return 400 when username is missing', async () => {
      const res = await chai
        .request(app)
        .post(USER_ENDPOINT)
        .send({ password: newUser.password, name: newUser.name });
      expect(res).to.have.status(400);
    });
    
    it('should return 400 when password is missing', async () => {
      const res = await chai
        .request(app)
        .post(USER_ENDPOINT)
        .send({ email: newUser.email, name: newUser.name });
      expect(res).to.have.status(400);
    });

    it('should reject duplicate emails', async () => {
      const userWithSameEmail = await User
        .query()
        .first();

      const existingEmail = userWithSameEmail.email;
      const res = await chai
        .request(app)
        .post(USER_ENDPOINT)
        .send({ ...newUser, email: existingEmail });

      expect(res).to.have.status(400);
    });

    it('should return 400 when password is less than 8 characters', async () => {
      const res = await chai
        .request(app)
        .post(USER_ENDPOINT)
        .send({ ...newUser, password: newUser.password.slice(0, 7)});

      expect(res).to.have.status(400);
    });

    it('should return 400 when email is invalid', async () => {
      const res = await chai
        .request(app)
        .post(USER_ENDPOINT)
        .send({ ...newUser, email: 'invalid_email' });

      expect(res).to.have.status(400);
    });
  });
});