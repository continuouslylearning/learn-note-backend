const Folder = require('../../models/folder');

function validateTopic(req, res, next) {
  const userId = req.user.id;
  const { title, parent, notebook } = req.body;

  if ('title' in req.body && typeof title !== 'string') {
    try {
      req.body.title = title.toString();
    } catch (e) {
      const err = new Error('Title is invalid.');
      err.status = 400;
      return next(err);
    }
  }

  if ('title' in req.body && !title.trim()) {
    const err = new Error('Title is required');
    err.status = 400;
    return next(err);
  }

  if ('parent' in req.body && typeof parent !== 'number') {
    req.body.parent = Number(parent);

    if (Number.isNaN(req.body.parent)) {
      const err = new Error('Parent id must be an integer.');
      err.status = 400;
      return next(err);
    }
  }

  if ('notebook' in req.body){
    try {
      JSON.stringify(notebook);
    } catch(e){
      return next({
        message: '`Notebook` must be JSON',
        status: 400
      });
    }
    if(!notebook.ops || !Array.isArray(notebook.ops)){
      return next ({
        message: 'The notebook JSON is not a valid QuillJS delta',
        status: 400
      });
    }
  }

  if ('parent' in req.body && parent !== null) {
    return Folder.query()
      .where({ userId, id: parent })
      .first()
      .then(folder => {
        if (!folder) {
          const err = new Error('Parent id is invalid');
          err.status = 400;
          return next(err);
        }
        return next();
      })
      .catch(next);
  }

  return next();
}

module.exports = validateTopic;
