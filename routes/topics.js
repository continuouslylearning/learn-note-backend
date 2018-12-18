const express = require('express');
const Topic = require('../models/topic');
const Folder = require('../models/folder');
const { requiredFields } = require('./validation/common');
const validateTopic = require('./validation/topic');

const router = express.Router();

/**
 * Given the object to modify, adds the parent field OR null
 * @param {{}} obj
 * @param {number} id
 * @param {string} title
 */
const appendParent = (obj, id, title) => {
  if (id && title) {
    obj.parent = { id, title };
  } else obj.parent = null;
};

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
        appendParent(topic, topic.parent, topic.folderTitle);
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
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
      appendParent(topic, item.folderId, item.folderTitle);

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

router.put('/:id', validateTopic, async (req, res, next) => {
  const userId = req.user.id;
  const topicId = req.params.id;

  const updateableFields = ['title', 'parent', 'lastOpened', 'notebook', 'resourceOrder'];
  const updatedTopic = {};
  updateableFields.forEach(field => {
    if (field in req.body) {
      if (req.body[field] === 0) req.body[field] = null;
      updatedTopic[field] = req.body[field];
    }
  });

  try {
    const topic = await Topic.query()
      .update(updatedTopic)
      .where({ userId, id: topicId })
      .returning('*')
      .first();

    if (!topic) throw new Error();

    delete topic.userId;

    // If a parent exists, append it to the response
    if (topic.parent) {
      topic.parent = await Folder.query()
        .select('id', 'title')
        .where({ id: topic.parent })
        .first();
    }

    return res.status(201).json(topic);
  } catch (e) {
    return next(e);
  }
});

router.post('/', requiredFields(['title']), validateTopic, async (req, res, next) => {
  const userId = req.user.id;

  const { title, parent, resourceOrder, lastOpened, notebook } = req.body;

  try {
    const topicExists = await Topic.query()
      .where({ userId, title })
      .first();

    if (topicExists) {
      const err = {
        message: 'Topic with this title already exists',
        status: 422
      };
      throw err;
    }

    const topic = await Topic.query()
      .insert({ userId, title, parent, resourceOrder, lastOpened, notebook })
      .returning('*');

    delete topic.userId;

    // If a parent exists, append it to the response
    if (topic.parent) {
      topic.parent = await Folder.query()
        .select('id', 'title')
        .where({ id: topic.parent })
        .first();
    }

    return res.status(201).json(topic);
  } catch (err) {
    return next(err);
  }
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
