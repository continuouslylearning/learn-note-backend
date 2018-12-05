const express = require('express');
const User = require('../models/user');
const validateUser = require('./validation/user');

const router = express.Router();

router.post('/', validateUser, (req, res, next) => {

  const { password, email, name } = req.body;

  User.query().where({ email })
    .then(users => {
      const user = users[0];
      if(user){
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

module.exports = router;