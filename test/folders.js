'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const expect = chai.expect;
const { Model } = require('objection');

chai.use(chaiHttp);

const app = require('../index');
const { dbConnect, dbDisconnect, dbGet, createTables, dropTables } = require('../db');
const { usersData, foldersData } = require('./seed');

const { JWT_SECRET, TEST_DB_URI } = require('../config');

const User = require('../models/user');
const Folder = require('../models/folder');

describe('FOLDERS API', function(){

  const FOLDERS_ENDPOINT = '/api/folders';
  const FOLDER_PROPERTIES = ['id', 'title', 'userId', 'createdAt', 'updatedAt'];
  let user;
  let userId;
  let token;
  let bearerToken;
  let knex;

  before(function(){
    this.timeout(5000);
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
        bearerToken = `Bearer ${token}`;
        return Folder
          .query()
          .insert(foldersData);
      })
      .then(() => knex.raw('SELECT setval(\'folders_id_seq\', (SELECT MAX(id) from "folders"));'))
      .then(() => knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));'));
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
      });
  });

  after(function(){
    return dbDisconnect();
  });

  describe('GET /folders', function(){

    it('should return the correct folders', function(){

      let resFolders;
      return chai.request(app)
        .get(FOLDERS_ENDPOINT)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          resFolders = res.body;
          resFolders.forEach(folder => {
            expect(folder).to.have.keys(FOLDER_PROPERTIES);
          });
          return Folder
            .query()
            .where({ userId });
        })
        .then(dbFolders => {
          expect(dbFolders.length).to.equal(resFolders.length);
          dbFolders.forEach((dbFolder, index) => {
            expect(dbFolder.id).to.equal(resFolders[index].id);
            expect(dbFolder.title).to.equal(resFolders[index].title);
            expect(new Date(dbFolder.createdAt)).to.deep.equal(new Date(resFolders[index].createdAt));
            expect(new Date(dbFolder.updatedAt)).to.deep.equal(new Date(resFolders[index].updatedAt));
          });
        });
    });

    it('should return 401 when JWT is not provided', function(){
      return chai.request(app)
        .get(FOLDERS_ENDPOINT)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });
  });

  describe('POST /folders', function(){
    const newFolder = {
      title: 'React/Redux',
      userId
    };

    it('should insert new folder into the table', function(){

      let resFolder;
      return chai.request(app)
        .post(FOLDERS_ENDPOINT)
        .send(newFolder)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(201);
          resFolder = res.body;
          expect(resFolder).to.have.keys(FOLDER_PROPERTIES);
          expect(resFolder.title).to.equal(newFolder.title);
          const folderId = res.body.id;
          return Folder
            .query()
            .where({ userId, id: folderId })
            .first();
        })
        .then(dbFolder => {
          expect(dbFolder.title).to.equal(newFolder.title);
          expect(new Date(dbFolder.createdAt)).to.deep.equal(new Date(resFolder.createdAt));
          expect(new Date(dbFolder.updatedAt)).to.deep.equal(new Date(resFolder.updatedAt));
        });
    });

    it('should return 401 when JWT is not provided', function(){
      return chai.request(app)
        .post(FOLDERS_ENDPOINT)
        .send(newFolder)
        .then(res => {
          expect(res).to.have.status(401);
        });
    });
  });

  describe.only('PUT /folder/:id', function(){
    const updatedFolder = {
      title: 'A unique folder name',
      userId
    };

    it('should update the folder in the table', function(){

      let resFolder;
      let folderId;
      return Folder
        .query()
        .where({ userId })
        .first()
        .then(folder => {
          folderId = folder.id;
          return chai.request(app)
            .put(`${FOLDERS_ENDPOINT}/${folderId}`)
            .send(updatedFolder)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          resFolder = res.body;
          expect(res).to.have.status(201);
          expect(res.body).to.have.keys(FOLDER_PROPERTIES);
          expect(resFolder.title).to.equal(updatedFolder.title);
          return Folder
            .query()
            .where({ userId, id: folderId })
            .first();
        })
        .then(dbFolder => {
          expect(dbFolder.title).to.equal(updatedFolder.title);
          expect(new Date(dbFolder.createdAt)).to.deep.equal(new Date(resFolder.createdAt));
          expect(new Date(dbFolder.updatedAt)).to.deep.equal(new Date(resFolder.updatedAt));
        });
    });

    
    it('should return 401 when JWT is not provided', async () => {
      const folder = await Folder
        .query()
        .where({ userId })
        .first();
      
      const response = await chai
        .request(app)
        .put(`${FOLDERS_ENDPOINT}/${folder.id}`)
        .send(updatedFolder);
      
      expect(response).to.have.status(401);
    });

    it('should return 404 when params id does not exist', async () => {
      const id = Math.floor(Math.random()*1000000);
      const updatedFolder = {
        title: 'React/Redux',
        userId
      };
 
      const res = await chai
        .request(app)
        .put(`${FOLDERS_ENDPOINT}/${id}`)
        .send(updatedFolder)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res).to.have.status(404);
    });

    it('should reject PUT requests with a duplicate folder name', async () => {

      const existingFolder = await Folder
        .query()
        .where({ userId })
        .first();

      const id = existingFolder.id;

      const folderWithDuplicatedName = await Folder
        .query()
        .where({ userId })
        .whereNot({ id })
        .first();
      
      const response = await chai
        .request(app)
        .put(`${FOLDERS_ENDPOINT}/${id}`)
        .send({
          title: folderWithDuplicatedName.title
        })
        .set('Authorization', bearerToken);
      
      expect(response).to.have.status(400);
    });
  });

  describe('DELETE /folder/:id', function(){

    it('should remove the folder from the table', function(){

      let folderId;

      return Folder
        .query()
        .where({ userId })
        .first()
        .then(folder => {
          folderId = folder.id;
          return chai.request(app)
            .delete(`${FOLDERS_ENDPOINT}/${folderId}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Folder
            .query()
            .where({ userId, id: folderId })
            .first();
        })
        .then(dbFolder => {
          expect(dbFolder).to.be.undefined;
        });
    });

    it('should return 401 when JWT is not provided', function(){

      return Folder
        .query()
        .where({ userId })
        .first()
        .then(folder => {
          const folderId = folder.id;
          return chai.request(app)
            .delete(`${FOLDERS_ENDPOINT}/${folderId}`);
        })
        .then(res => {
          expect(res).to.have.status(401);
        });
    });

    it('should return 404 when params id does not exist', function(){
      const id = Math.floor(Math.random()*1000000);
      
      return chai.request(app)
        .delete(`${FOLDERS_ENDPOINT}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });
});