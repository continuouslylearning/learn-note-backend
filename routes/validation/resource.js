const Topic = require('../../models/topic');
const Url = require('url-parse');

const isValidUri = uri => /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(uri);

function appendResourceType(req, res, next) {
  const { uri } = req.body;

  const parsedUri = new Url(uri, null, true);

  if (parsedUri.host === 'www.youtube.com' && parsedUri.query.v !== undefined) {
    req.body.type = 'youtube';
    req.body.uri = parsedUri.query.v;
  } else req.body.type = 'other';

  return next();
}

function validateResource(req, res, next) {
  const userId = req.user.id;
  const { parent, title } = req.body;

  if ('title' in req.body && typeof title !== 'string') {
    try {
      req.body.title = title.toString();
    } catch (e) {
      const err = new Error('Title is invalid.');
      err.status = 422;
      return next(err);
    }
  }

  if ('title' in req.body && !title.trim()) {
    const err = new Error('Title is required');
    err.status = 422;
    return next(err);
  }

<<<<<<< HEAD
  if (
    'type' in req.body &&
    (req.body.type !== 'youtube' && req.body.type !== 'other')
  ) {
    const err = new Error(
      'Only allowed values for `type` are `youtube` and `other`'
    );
=======
  if ('uri' in req.body && !isValidUri(req.body.uri)) {
    const err = new Error('Uri is invalid.');
>>>>>>> 8f87f6bb9f997754ca8465a89f4c183ac092628f
    err.status = 422;
    return next(err);
  }

<<<<<<< HEAD
  if ('type' in req.body && req.body.type === 'youtube') {
    try {
      req.body.uri = req.body.uri.split('v=')[1].slice(0, 11);
    } catch (e) {
      const err = new Error('Youtube url is invalid');
=======
  if ('parent' in req.body && typeof parent !== 'number') {
    req.body.parent = Number(parent);

    if (Number.isNaN(req.body.parent)) {
      const err = new Error('Parent is invalid.');
>>>>>>> 8f87f6bb9f997754ca8465a89f4c183ac092628f
      err.status = 422;
      return next(err);
    }
  }
  if ('parent' in req.body) {
    return Topic.query()
      .where({ userId, id: parent })
      .first()
      .then(topic => {
        if (!topic) {
          const err = new Error('Topic id not found.');
          err.status = 422;
          return next(err);
        }
        return next();
      })
      .catch(next);
  }
  return next();
}

module.exports = {
  validateResource,
  appendResourceType
};
