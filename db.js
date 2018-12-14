const Knex = require('knex');
const { DB_URI } = require('./config');
const { createUsers, createFolders, createTopics, createResources } = require('./schema');

let knex = null;

function dbConnect(url = DB_URI) {

  knex = Knex({
    client: 'pg',
    connection: url
  });
}

function createTables(knex){
  return createUsers(knex)
    .then(() => createFolders(knex))
    .then(() => createTopics(knex))
    .then(() => createResources(knex));
}

function dropTables(knex){
  return knex.schema
    .dropTableIfExists('resources')
    .dropTableIfExists('topics')
    .dropTableIfExists('folders')
    .dropTableIfExists('users');
}

function dbDisconnect() {
  return knex.destroy();
}

function dbGet() {
  return knex;
}

module.exports = {
  dbConnect,
  dbDisconnect,
  dbGet,
  createTables, 
  dropTables
};
