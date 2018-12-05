'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Model } = require('objection');
const { dbConnect, dbGet } = require('./db');

const { PORT, CLIENT_ORIGIN } = require('./config');

const jwtAuth = require('./strategies/jwt');

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const foldersRouter = require('./routes/folders');

const app = express();

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/auth', authRouter);
app.use('/api/folders', jwtAuth, foldersRouter);


app.use((req, res, next) => {
  const err = new Error('Not found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = { 
      ...err,
      message: err.message 
    };
    return res.status(err.status).json(errBody);
  } else {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

function runServer(port = PORT) {
  const server = app
    .listen(port, () => {
      console.info(`App listening on port ${server.address().port}`);
    })
    .on('error', err => {
      console.error('Express failed to start');
      console.error(err);
    });
}

if (require.main === module) {
  runServer();
  dbConnect();
  const knex = dbGet();
  Model.knex(knex);
}

module.exports = app;
