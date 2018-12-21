const express = require('express');
const User = require('../models/user');
const validateUser = require('./validation/user');
const { requiredFields } = require('./validation/common');

const router = express.Router();

router.post('/', 
  requiredFields(['email', 'password', 'name']), 
  validateUser, 
  async (req, res, next) => {
    const { password, email, name } = req.body;

    try {
      const user = await User.query()
        .where({ email })
        .first();

      if (user) {
        throw {
          message: 'User with this email already exists',
          status: 400
        };
      }
      const hash = await User.hashPassword(password);
      
      const newUser = await User
        .query()
        .insert({ 
          email, 
          password: hash, 
          name 
        });

      return res.status(201).json(newUser.serialize());
    } catch(e){
      next(e);
    }
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
