const Knex = require('knex');
const { DB_URI } = require('./config');


let knex = null;

function dbConnect(url = DB_URI) {
  knex = Knex({
    client: 'pg',
    connection: url
  });
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
  dbGet
};
