const express = require('express');
const User = require('../models/user');
const validateUser = require('./validation/user');

const router = express.Router();

router.post('/', validateUser, (req, res, next) => {
  const { password, email, name } = req.body;

  User.query()
    .where({ email })
    .first()
    .then(user => {
      if (user) {
        const err = new Error('User with this email already exists');
        err.status = 422;
        return Promise.reject(err);
      }
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.query().insert({ email, password: hash, name });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const userId = req.params.id;

  return User.query()
    .where({ id: userId })
    .then(results => {
      if (!results.length) return Promise.reject();
      const item = results[0];

      const user = {
        userId: item.id,
        topicOrder: item.topicOrder
      };

      return res.json(user);
    })
    .catch(next);
});

router.put('/:id', (req, res, next) => {
  const userId = req.params.id;
  const topicOrder = req.body.topicOrder;

  return User.query()
    .update({ topicOrder })
    .where({ id: userId })
    .returning('*')
    .first()
    .then(topic => {
      if (!topic) {
        return Promise.reject();
      }
      return res.status(201).json(topic);
    })
    .catch(next);
});

module.exports = router;
