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

describe('FOLDERS API', async () => {

  const FOLDERS_ENDPOINT = '/api/folders';
  const FOLDER_PROPERTIES = ['id', 'title', 'userId', 'createdAt', 'updatedAt'];
  let user;
  let userId;
  let bearerToken;
  let knex;

  before(function() {
    this.timeout(5000);
    dbConnect(TEST_DB_URI);
    knex = dbGet();
    Model.knex(knex);
    return dropTables(knex)
      .then(() => createTables(knex));
  });

  beforeEach(async () => {
    user = await User
      .query()
      .insert(usersData)
      .returning('*')
      .first();

    userId = user.id;
    const token = jwt.sign(
      { user: user.serialize() }, 
      JWT_SECRET, 
      { subject: user.email }
    );
    bearerToken = `Bearer ${token}`;
    await Folder
      .query()
      .insert(foldersData);
    await knex.raw('SELECT setval(\'folders_id_seq\', (SELECT MAX(id) from "folders"));');
    await knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));');
  });

  afterEach(async () => {
    await Folder
      .query()
      .delete();
    
    await User
      .query()
      .delete();
  });

  after(async () => {
    await dbDisconnect();
  });

  describe('GET /folders', async () => {

    it('should return the correct folders', async () => {

      let resFolders;
      const res = await chai
        .request(app)
        .get(FOLDERS_ENDPOINT)
        .set('Authorization', bearerToken);
    
      expect(res).to.have.status(200);
      resFolders = res.body;
      resFolders.forEach(folder => {
        expect(folder).to.have.keys(FOLDER_PROPERTIES);
      });

      const dbFolders = await Folder
        .query()
        .where({ userId });

      expect(dbFolders.length).to.equal(resFolders.length);
      dbFolders.forEach((dbFolder, index) => {
        expect(dbFolder.id).to.equal(resFolders[index].id);
        expect(dbFolder.title).to.equal(resFolders[index].title);
        expect(new Date(dbFolder.createdAt)).to.deep.equal(new Date(resFolders[index].createdAt));
        expect(new Date(dbFolder.updatedAt)).to.deep.equal(new Date(resFolders[index].updatedAt));
      });
    });

    it('should return 401 when JWT is not provided', async () => {
      const res = await chai.request(app)
        .get(FOLDERS_ENDPOINT);
      expect(res).to.have.status(401);
    });
  });

  describe('POST /folders', async () => {
    const newFolder = {
      title: 'React/Redux',
      userId
    };

    it('should insert new folder into the table', async () => {
      const res = await chai.request(app)
        .post(FOLDERS_ENDPOINT)
        .send(newFolder)
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(201);
      const resFolder = res.body;
      expect(resFolder).to.have.keys(FOLDER_PROPERTIES);
      expect(resFolder.title).to.equal(newFolder.title);
      const folderId = res.body.id;

      const dbFolder = await Folder
        .query()
        .where({ userId, id: folderId })
        .first();

      expect(dbFolder.title).to.equal(newFolder.title);
      expect(new Date(dbFolder.createdAt)).to.deep.equal(new Date(resFolder.createdAt));
      expect(new Date(dbFolder.updatedAt)).to.deep.equal(new Date(resFolder.updatedAt));
    });

    it('should return 401 when JWT is not provided', async () => {
      const res = await chai.request(app)
        .post(FOLDERS_ENDPOINT)
        .send(newFolder);
      
      expect(res).to.have.status(401);
    });

    it('should return 400 when the title field is missing', async () => {

      const res = await chai
        .request(app)
        .post(FOLDERS_ENDPOINT)
        .send({})
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(400);
    });

    it('should return 400 when the title field is an empty string', async () => {

      const res = await chai
        .request(app)
        .post(FOLDERS_ENDPOINT)
        .send({ title: ' '})
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(400);
    });

    it('should return 400 for duplicate folder titles', async () => {

      const existingFolder = await Folder
        .query()
        .where({ userId })
        .first();
    
      const res = await chai
        .request(app)
        .post(FOLDERS_ENDPOINT)
        .send({
          title: existingFolder.title
        })
        .set('Authorization', bearerToken);
      
      expect(res).to.have.status(400);
    });


  });

  describe('PUT /folder/:id', async () => {
    const updatedFolder = {
      title: 'A unique folder name',
      userId
    };

    it('should update the folder in the table', async () => {
      const folder = await Folder
        .query()
        .where({ userId })
        .first();

      const res = await chai.request(app)
        .put(`${FOLDERS_ENDPOINT}/${folder.id}`)
        .send(updatedFolder)
        .set('Authorization', bearerToken);

      expect(res).to.have.status(201);

      const resFolder = res.body;
      expect(resFolder).to.have.keys(FOLDER_PROPERTIES);
      expect(resFolder.title).to.equal(updatedFolder.title);

      const dbFolder = await Folder
        .query()
        .where({ userId, id: folder.id })
        .first();

      expect(dbFolder.title).to.equal(updatedFolder.title);
      expect(new Date(dbFolder.createdAt)).to.deep.equal(new Date(resFolder.createdAt));
      expect(new Date(dbFolder.updatedAt)).to.deep.equal(new Date(resFolder.updatedAt));
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
        .set('Authorization', bearerToken);
      
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

    it('should return 400 when folder title is an empty string', async () => {
      const folder = await Folder
        .query()
        .where({ userId })
        .first();

      const res = await chai
        .request(app)
        .put(`${FOLDERS_ENDPOINT}/${folder.id}`)
        .send({
          title: ' '
        })
        .set('Authorization', bearerToken);

      expect(res).to.have.status(400);
    });
  });

  describe('DELETE /folder/:id', async () => {

    it('should remove the folder from the table', async () => {

      const folder = await Folder
        .query()
        .where({ userId })
        .first();
    
      const res = await chai
        .request(app)
        .delete(`${FOLDERS_ENDPOINT}/${folder.id}`)
        .set('Authorization', bearerToken);

      expect(res).to.have.status(204);

      const folderAfterDeleteRequest = await Folder
        .query()
        .where({ userId, id: folder.id })
        .first();

      expect(folderAfterDeleteRequest).to.be.undefined;
    });

    it('should return 401 when JWT is not provided', async () => {

      const folder = await Folder
        .query()
        .where({ userId })
        .first();

      const res = await chai
        .request(app)
        .delete(`${FOLDERS_ENDPOINT}/${folder.id}`);

      expect(res).to.have.status(401);
    });

    it('should return 404 when params id does not exist', async () => {
      const id = Math.floor(Math.random()*1000000);
      
      const res = await chai
        .request(app)
        .delete(`${FOLDERS_ENDPOINT}/${id}`)
        .set('Authorization', bearerToken);
        
      expect(res).to.have.status(404);
    });
  });
});