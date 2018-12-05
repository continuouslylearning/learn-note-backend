const User = require('../models/user');

module.exports = function localAuth(req, res, next){
  const { email, password } = req.body;
  if(!email || !password){
    const err = new Error('Missing username or password');
    err.status = 422;
    return next(err);
  }

  let user;
  User.query().where({ email })
    .then(users => {
      user = users[0];
      if(!users.length){
        const err = new Error('Email is not valid');
        err.status = 401;
        return Promise.reject(err);
      }
      return user.validatePassword(password);
    })
    .then(isValid => {
      if(!isValid){
        const err = new Error('Password is invalid');
        err.status = 401;
        return Promise.reject(err);
      }
      req.user = user.serialize();
      return next();
    })
    .catch(next);
};