function validateFolder(req, res, next){

  const { title } = req.body;

  if(!('title' in req.body)){
    const err = new Error('Folder title is required');
    err.status = 400;
    return next(err);
  }

  if(typeof title !== 'string'){
    const err = new Error('Folder title must be a string');
    err.status = 422;
    return next(err);
  }

  if(!title.trim()){
    const err = new Error('Folder title is required');
    err.status = 422;
    return next(err);
  }

  return next();
}

module.exports = validateFolder;