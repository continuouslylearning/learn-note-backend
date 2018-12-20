function validateFolder(req, res, next) {
  const { title } = req.body;

  if ('title' in req.body && typeof title !== 'string') {
    try {
      req.body.title = title.toString();
    } catch (e) {
      const err = new Error('Folder title must be a string');
      err.status = 400;
      return next(err);
    }
  }

  if ('title' in req.body && !title.trim()) {
    const err = new Error('Folder title is required');
    err.status = 400;
    return next(err);
  }

  return next();
}

module.exports = validateFolder;
