const { dbConnect, createTables, dbGet, dbDisconnect, dropTables } = require('./db');

const Model = require('objection').Model;
const User = require('./models/user');
const Folder = require('./models/folder');
const Topic = require('./models/topic');
const Resource = require('./models/resource');
const { foldersData, topicsData, resourcesData, usersData } = require('./test/seed');

dbConnect();
const knex = dbGet();
Model.knex(knex);

Promise.all(usersData.map(user => User.hashPassword(user.password)))
  .then(hashes => {
    usersData.forEach((user, index) => {
      user.password = hashes[index];
    });
    return dropTables(knex);
  })
  .then(() => createTables(knex))
  .then(() => {
    return User
      .query()
      .insert(usersData)
      .returning('*')
      .first();
  })
  .then(() => {
    return Folder
      .query()
      .insert(foldersData);
  })
  .then(() => {
    return Topic
      .query()
      .insert(topicsData);
  })
  .then(() => {
    return Resource
      .query()
      .insert(resourcesData);
  })
  .then(() => knex.raw('SELECT setval(\'resources_id_seq\', (SELECT MAX(id) from "resources"));'))
  .then(() => knex.raw('SELECT setval(\'topics_id_seq\', (SELECT MAX(id) from "topics"));'))
  .then(() => knex.raw('SELECT setval(\'folders_id_seq\', (SELECT MAX(id) from "folders"));'))
  .then(() => knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));'))
  .then(() => dbDisconnect())
  .catch(() => dbDisconnect());

