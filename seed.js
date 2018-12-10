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
    return;
  })
  .then(() => dropTables(knex))
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
  .then(() => dbDisconnect())
  .catch(() => dbDisconnect());

