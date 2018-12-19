const Folder = require('../../models/folder');

function validateTopic(req, res, next) {
  const userId = req.user.id;
  const { title, parent } = req.body;

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
      const err = new Error('Parent is invalid.');
      err.status = 400;
      return next(err);
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
