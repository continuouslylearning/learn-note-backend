const Knex = require('knex');
const { DB_URI } = require('./config');

let knex = null;

function dbConnect(url = DB_URI) {

  knex = Knex({
    client: 'pg',
    connection: url
  });

  knex.schema.hasTable('users')
    .then(exists => {
      if(!exists){
        return knex.schema.createTable('users', table => {
          table.increments('id').primary();
          table.string('email').unique().notNullable();
          table.string('name').notNullable();
          table.string('password').notNullable();
        });
      }
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
