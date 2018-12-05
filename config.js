'use strict';

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'not_a_real_password',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  PORT: process.env.PORT || 8080,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  DB_URI: process.env.DB_URI || 'postgresql://dev:@localhost/learn-note'
};
