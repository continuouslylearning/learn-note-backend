const Topic = require('../../models/topic');

function validateResource(req, res, next){

  const userId = req.user.id;
  const { parent, title } = req.body;


  if('title' in req.body){
    if(typeof title !== 'string'){
      const err = new Error('Title must be a string');
      err.status = 422;
      return next(err);
    }
  }


  if(req.method === 'PUT' && !('parent' in req.body)) {
    return next();
  }

  if(!parent){
    const err = new Error('Parent id is required');
    err.status = 400;
    return next(err);
  }

  if(typeof parent !== 'number'){
    const err = new Error('Parent must be an integer');
    err.status = 422;
    return next(err);
  }

  Topic
    .query()
    .where({ userId, id: parent })
    .first()
    .then(topic => {
      if(!topic){
        const err = new Error('Topic id is invalid');
        err.status = 422;
        return Promise.reject(err);
      }
      return next();
    })
    .catch(next);
}

module.exports = validateResource;