const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function jwtAuth(req, res, next){
  const auth = req.header('Authorization');
  
  if(!auth){
    const err = new Error('Authorization header is missing');
    err.status = 401;
    return next(err);
  }

  const [ scheme, token ] = auth.split(' ');

  if(scheme !== 'Bearer' ||!token){
    const err = new Error('Token is missing');
    err.status = 401;
    return next(err);
  }

  jwt.verify(token, JWT_SECRET,(err, payload) => {
    if(err){
      const err = new Error('Invalid JWT');
      err.status = 401;
      return next(err);
    }
    
    req.user = payload.user;
    return next();
  });
}

module.exports = jwtAuth;