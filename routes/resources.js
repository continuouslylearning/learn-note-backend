const express = require('express');
const Resource = require('../models/resource');
const Topic = require('../models/topic');
const validateResource = require('./validation/resource');

const router = express.Router();

router.get('/', (req, res, next) => {
  const userId = req.user.id;
  const { limit, orderBy } = req.query;

  Topic
    .query()
    .select(
      'resources.id as id', 
      'resources.parent as parent', 
      'resources.title as title', 
      'uri', 
      'completed', 
      'resources.lastOpened as lastOpened',
      'topics.title as topicTitle'
    )
    .join('resources', 'topics.id', 'resources.parent')
    .where({ 'topics.userId': userId })
    .modify(query => {
      if(limit) query.limit(limit);
    })
    .modify(query => {
      if(orderBy) query.orderBy(orderBy, 'desc');
    })
    .then(results => {
      results.forEach(result => {
        result.parent = {
          id: result.parent,
          title: result.topicTitle
        };
      });
      return res.json(results);
    })
    .catch(next);
});


router.get('/:id', (req, res, next) => {
  const userId = req.user.id;
  const topicId = req.params.id;

  Topic
    .query()
    .select(
      'resources.id as id', 
      'resources.parent as parent', 
      'resources.title as title', 
      'uri', 
      'completed', 
      'resources.lastOpened as lastOpened',
      'topics.title as topicTitle'
    )
    .join('resources', 'topics.id', 'resources.parent')
    .where({ 'topics.userId': userId, 'topics.id': topicId })
    .then(resources => {
      resources.forEach(resource => {
        resource.parent = {
          id: resource.parent,
          title: resource.topicTitle
        };
      });
      resources.sort((a, b) => b.lastOpened - a.lastOpened);
      return res.json(resources);
    })
    .catch(next);
});

router.put('/:id', validateResource, (req, res, next) => {
  const userId = req.user.id;
  const resourceId = req.params.id;

  const updateableFields = ['parent', 'title', 'uri', 'completed', 'lastOpened'];
  const updatedResource = {};
  updateableFields.forEach(field => {
    if(field in req.body) {
      updatedResource[field] = req.body[field];
    }
  });
  
  Resource
    .query()
    .update(updatedResource)
    .where({ id: resourceId, userId })
    .returning('*')
    .first()
    .then(resource => {
      if(!resource) {
        return Promise.reject();
      }
      return res.status(201).json(resource);
    })
    .catch(next);
});

router.post('/', validateResource, (req, res, next) => {
  const userId = req.user.id;
  const { parent, title, uri, completed, lastOpened } = req.body;

  Resource
    .query()
    .where({ userId, title })
    .first()
    .then(resource => {
      if(resource) {
        const err = new Error('Resource with this title already exists');
        err.status = 422;
        return Promise.reject(err);
      }
      
      return Resource
        .query()
        .insert({ userId, parent, title, uri, completed, lastOpened })
        .returning('*');
    })
    .then(resource => {
      return res.status(201).json(resource);
    })
    .catch(next);
});

router.delete('/:id', (req, res, next) => {
  const resourceId = req.params.id;
  const userId = req.user.id;

  Resource
    .query()
    .delete()
    .where({ userId, id: resourceId })
    .returning('*')
    .first()
    .then(resource => {
      if(!resource){
        return Promise.reject();
      }
      return res.sendStatus(204);
    })
    .catch(next);
});


module.exports = router;