const express = require('express');
const Topic = require('../models/topic');
const Folder = require('../models/folder');
const { requiredFields } = require('./validation/common');
const validateTopic = require('./validation/topic');

const router = express.Router();

router.get('/', (req, res, next) => {
  // Configure ?notebooks
  const shouldSelectNotebooks = req.query.notebooks || false;
  // Configure ?resourceOrder
  const shouldSelectResourceOrder = req.query.resourceOrder || false;

  const userId = req.user.id;
  return Folder.query()
    .select(
      'topics.id as id',
      'topics.parent as parent',
      'topics.title',
      'topics.createdAt',
      'topics.updatedAt',
      'folders.title as folderTitle'
    )
    .modify(queryBuilder => {
      if (shouldSelectNotebooks) queryBuilder.select('topics.notebook as notebook');
      if (shouldSelectResourceOrder) queryBuilder.select('topics.resourceOrder as resourceOrder');
      return queryBuilder;
    })
    .rightJoin('topics', 'folders.id', 'topics.parent')
    .where({ 'topics.userId': userId })
    .then(topics => {
      topics.forEach(topic => {
        topic.parent = {
          id: topic.parent,
          title: topic.folderTitle
        };
        delete topic.folderTitle;
      });
      return res.json(topics);
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const userId = req.user.id;
  const topicId = req.params.id;
  // Configure ?notebook to be true by default
  const shouldShowNotebook = !(req.query.notebook === 'false');
  // Configure ?resources to be true by default
  const shouldShowResources = !(req.query.resources === 'false');
  // Configure ?resourceOrder to be true by default
  const shouldShowResourceOrder = !(req.query.resourceOrder === 'false');

  return Folder.query()
    .select(
      'topics.id as id',
      'topics.parent as folderId',
      'topics.title',
      'topics.createdAt',
      'topics.updatedAt',
      'folders.title as folderTitle'
    )
    .rightJoin('topics', 'folders.id', 'topics.parent')
    .modify(queryBuilder => {
      if (shouldShowNotebook) queryBuilder.select('topics.notebook as notebook');
      if (shouldShowResourceOrder) queryBuilder.select('topics.resourceOrder as resourceOrder');
      if (shouldShowResources) {
        queryBuilder
          .select(
            'resources.id as resourceId',
            'resources.title as resourceTitle',
            'resources.type as type',
            'resources.uri as uri',
            'resources.completed as completed',
            'resources.lastOpened as lastOpened'
          )
          .leftJoin('resources', 'topics.id', 'resources.parent');
      }
      return queryBuilder;
    })
    .where({ 'topics.userId': userId, 'topics.id': topicId })
    .then(results => {
      if (!results.length) return Promise.reject();
      const item = results[0];

      const topic = {
        id: item.id,
        title: item.title,
        parent: {
          id: item.folderId,
          title: item.folderTitle
        },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };

      if (shouldShowNotebook) topic.notebook = item.notebook;

      if (shouldShowResourceOrder) topic.resourceOrder = item.resourceOrder;

      if (shouldShowResources) {
        topic.resources = [];
        results.forEach(item => {
          if (!item.resourceId) return;
          topic.resources.push({
            id: item.resourceId,
            title: item.resourceTitle,
            type: item.type,
            uri: item.uri,
            completed: item.completed,
            lastOpened: item.lastOpened
          });
        });
      }

      return res.json(topic);
    })
    .catch(next);
});

router.put('/:id', validateTopic, (req, res, next) => {
  const userId = req.user.id;
  const topicId = req.params.id;

  const updateableFields = ['title', 'parent', 'lastOpened', 'notebook', 'resourceOrder'];
  const updatedTopic = {};
  updateableFields.forEach(field => {
    if (field in req.body) {
      updatedTopic[field] = req.body[field];
    }
  });

  return Topic.query()
    .update(updatedTopic)
    .where({ userId, id: topicId })
    .returning('*')
    .first()
    .then(topic => {
      if (!topic) {
        return Promise.reject();
      }
      delete topic.userId;
      return res.status(201).json(topic);
    })
    .catch(next);
});

router.post('/', requiredFields(['title']), validateTopic, (req, res, next) => {
  const userId = req.user.id;

  const { title, parent, resourceOrder, lastOpened, notebook } = req.body;

  Topic.query()
    .where({ userId, title })
    .first()
    .then(topic => {
      if (topic) {
        const err = new Error('Topic with this title already exists');
        err.status = 422;
        return Promise.reject(err);
      }
      return Topic.query()
        .insert({ userId, title, parent, resourceOrder, lastOpened, notebook })
        .returning('*');
    })
    .then(topic => {
      delete topic.userId;
      return res.status(201).json(topic);
    })
    .catch(next);
});

router.delete('/:id', (req, res, next) => {
  const userId = req.user.id;
  const topicId = req.params.id;

  Topic.query()
    .delete()
    .where({ userId, id: topicId })
    .returning('*')
    .first()
    .then(topic => {
      if (!topic) return Promise.reject();
      return res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;
