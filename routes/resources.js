const express = require('express');
const Resource = require('../models/resource');
const Topic = require('../models/topic');
const validateResource = require('./validation/resource');

const router = express.Router();

router.get('/', (req, res, next) => {
  const userId = req.user.id;
  const { limit, orderBy } = req.query;

  Topic.query()
    .select(
      'resources.id as id',
      'resources.parent as parent',
      'resources.title as title',
      'resources.type as type',
      'resources.uri as uri',
      'resources.completed as completed',
      'resources.lastOpened as lastOpened',
      'topics.title as topicTitle'
    )
    .join('resources', 'topics.id', 'resources.parent')
    .where({ 'topics.userId': userId })
    .modify(query => {
      if (limit) query.limit(limit);
      if (orderBy) query.orderBy(orderBy, 'desc');
      return query;
    })
    .then(results => {
      results.forEach(result => {
        result.parent = {
          id: result.parent,
          title: result.topicTitle
        };
        delete result.topicTitle;
      });
      // results.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
      return res.json(results);
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const userId = req.user.id;
  const id = req.params.id;

  return Resource.query()
    .select(
      'resources.id as id',
      'resources.parent as parentId',
      'resources.title as title',
      'resources.type as type',
      'resources.uri as uri',
      'resources.completed as completed',
      'resources.lastOpened as lastOpened',
      'topics.title as parentTitle'
    )
    .from('resources')
    .leftJoin('topics', 'resources.parent', 'topics.id')
    .where({ 'resources.userId': userId, 'resources.id': id })
    .then(([resource]) => {
      if (!resource) return Promise.reject();
      // Normalize parent to an object
      resource.parent = { id: resource.parentId, title: resource.parentTitle };
      delete resource.parentId, delete resource.parentTitle;
      return res.json(resource);
    })
    .catch(next);
});

router.put('/:id', validateResource, (req, res, next) => {
  const userId = req.user.id;
  const resourceId = req.params.id;

  const updateableFields = ['parent', 'title', 'type', 'uri', 'completed', 'lastOpened'];
  const updatedResource = {};
  updateableFields.forEach(field => {
    if (field in req.body) {
      updatedResource[field] = req.body[field];
    }
  });

  Resource.query()
    .update(updatedResource)
    .where({ id: resourceId, userId })
    .returning('*')
    .first()
    .then(resource => {
      if (!resource) {
        return Promise.reject();
      }
      return res.status(201).json(resource);
    })
    .catch(next);
});

router.post('/', validateResource, (req, res, next) => {
  const userId = req.user.id;
  let { parent, title, uri, type, completed, lastOpened } = req.body;

  Resource.query()
    .where({ userId, title })
    .first()
    .then(resource => {
      if (resource) {
        const err = new Error('Resource with this title already exists');
        err.status = 422;
        return Promise.reject(err);
      }

      return Resource.query()
        .insert({ userId, parent, title, uri, type, completed, lastOpened })
        .returning('*');
    })
    .then(resource => {
      delete resource.userId;
      return res.status(201).json(resource);
    })
    .catch(next);
});

router.delete('/:id', (req, res, next) => {
  const resourceId = req.params.id;
  const userId = req.user.id;

  Resource.query()
    .delete()
    .where({ userId, id: resourceId })
    .returning('*')
    .first()
    .then(resource => {
      if (!resource) {
        return Promise.reject();
      }
      return res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;
