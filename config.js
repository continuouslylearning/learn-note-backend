'use strict';

module.exports = {
  PORT: process.env.PORT || 8080,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  DB_URI:
        process.env.DB_URI || 'postgres://localhost/learn'
};
