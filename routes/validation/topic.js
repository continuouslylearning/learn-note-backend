const Folder = require('../../models/folder');

function validateTopic(req, res, next){
  const userId = req.user.id;
  const { title, parent } = req.body;

  if('title' in req.body){
    if(typeof title !== 'string'){
      const err = new Error('Title must be a string');
      err.status = 422;
      return next(err);
    }

    if(!title.trim()){
      const err = new Error('Title is required');
      err.status = 422;
      return next(err);
    }
  }

  if(!('parent' in req.body) || parent === null){
    return next();
  }

  if(typeof parent !== 'number'){
    const err = new Error('Parent must be an integer');
    err.status = 422;
    return next(err);
  }

  return Folder
    .query()
    .where({ userId, id: parent })
    .first()
    .then(folder => {
      if(!folder){
        const err = new Error('Parent id is invalid');
        err.status = 422;
        return Promise.reject(err);
      }
      return next();
    })
    .catch(next);
}

module.exports = validateTopic;