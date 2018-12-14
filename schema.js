function createUsers(knex){
  return knex.schema.hasTable('users')
    .then(exists => {
      if(exists) return;
      return knex.schema.createTable('users', table => {
        table.increments('id').primary();
        table.string('email').unique().notNullable();
        table.string('name').notNullable();
        table.string('password').notNullable();
      });
    });
}

function createFolders(knex){
  return knex.schema.hasTable('folders')
    .then(exists => {
      if(exists) return;
      return knex.schema.createTable('folders', table => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.unique(['userId', 'title']);
        table.integer('userId').notNullable();
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
        table.foreign('userId').references('id').inTable('users');
      });
    });
}

function createTopics(knex){
  return knex.schema.hasTable('topics')
    .then(exists => {
      if(exists) return;
      return knex.schema.createTable('topics', table => {
        table.increments('id').primary();
        table.integer('userId').notNullable();
        table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
        table.string('title').notNullable();
        table.unique(['userId', 'title']);
        table.integer('parent');
        table.foreign('parent').references('id').inTable('folders').onDelete('SET NULL');
        table.jsonb('notebook');
        table.jsonb('resourceOrder');
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
      });
    });
}

function createResources(knex){
  return knex.schema.hasTable('resources')
    .then(exists => {
      if(exists) return;
      return knex.schema.createTable('resources', table => {
        table.increments('id').primary();
        table.integer('userId').notNullable();
        table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
        table.integer('parent').notNullable();
        table.foreign('parent').references('id').inTable('topics').onDelete('CASCADE');
        table.string('title').notNullable();
        table.string('uri').notNullable();
        table.enum('type', ['youtube', 'other']).notNullable();
        table.boolean('completed').notNullable().defaultTo(false);
        table.timestamp('lastOpened').notNullable().defaultTo(knex.fn.now());
      });
    });
}

module.exports = {
  createUsers,
  createFolders,
  createTopics,
  createResources
};