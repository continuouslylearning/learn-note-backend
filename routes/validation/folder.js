function validateFolder(req, res, next){

  const { name } = req.body;

  if(!('name' in req.body)){
    const err = new Error('Folder name is required');
    err.status = 400;
    return next(err);
  }

  if(typeof name !== 'string'){
    const err = new Error('Folder name must be a string');
    err.status = 422;
    return next(err);
  }

  if(!name.trim()){
    const err = new Error('Folder name is required');
    err.status = 422;
    return next(err);
  }

  return next();
}

module.exports = validateFolder;