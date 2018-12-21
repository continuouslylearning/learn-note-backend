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

router.get('/', async (req, res, next) => {
  // Configure ?notebooks
  const shouldSelectNotebooks = req.query.notebooks || false;
  // Configure ?resourceOrder
  const shouldSelectResourceOrder = req.query.resourceOrder || false;
  // Configure ?orderBy
  const shouldOrderByColumn = req.query.orderBy || false;
  // Configure ?orderDirection
  const orderDirection = req.query.orderDirection || 'desc';
  // Configure ?limit
  const limit = req.query.limit;

  const userId = req.user.id;
  
  try {
    const topics = await Topic.query()
      .select(
        'topics.id as id',
        'topics.parent as parent',
        'topics.title',
        'topics.createdAt',
        'topics.updatedAt',
        'folders.title as folderTitle'
      )
      .modify(query => {
        if (shouldSelectNotebooks) query.select('topics.notebook as notebook');
        if (shouldSelectResourceOrder) query.select('topics.resourceOrder as resourceOrder');
        if (shouldOrderByColumn) query.orderBy(shouldOrderByColumn, orderDirection);
        if (limit) query.limit(limit);
        return query;
      })
      .leftJoin('folders', 'folders.id', 'topics.parent')
      .where({ 'topics.userId': userId });

    topics.forEach(topic => {
      topic.appendParent();
    });
  
    return res.json(topics);
  } catch(e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  const userId = req.user.id;
  const topicId = req.params.id;
  // Configure ?notebook to be true by default
  const shouldShowNotebook = !(req.query.notebook === 'false');
  // Configure ?resources to be true by default
  const shouldShowResources = !(req.query.resources === 'false');
  // Configure ?resourceOrder to be true by default
  const shouldShowResourceOrder = !(req.query.resourceOrder === 'false');

  try {
    const results = await Topic.query()
      .select(
        'topics.id as id',
        'topics.parent as folderId',
        'topics.title',
        'topics.createdAt',
        'topics.updatedAt',
        'folders.title as folderTitle'
      )
      .leftJoin('folders', 'folders.id', 'topics.parent')
      .modify(query => {
        if (shouldShowNotebook) query.select('topics.notebook as notebook');
        if (shouldShowResourceOrder) query.select('topics.resourceOrder as resourceOrder');
        if (shouldShowResources) {
          query
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
        return query;
      })
      .where({ 'topics.userId': userId, 'topics.id': topicId });

    if (!results.length) return next();
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
  } catch(e){
    return next(e);
  }
});

router.put('/:id', validateTopic, async (req, res, next) => {
  const userId = req.user.id;
  const topicId = req.params.id;

  const updateableFields = ['title', 'parent', 'notebook', 'resourceOrder'];
  const updatedTopic = {};
  updateableFields.forEach(field => {
    if (field in req.body) {
      if (req.body[field] === 0) req.body[field] = null;
      updatedTopic[field] = req.body[field];
    }
  });

  try {

    if('title' in req.body){
      const topicWithSameName = await Topic
        .query()
        .where({ userId, title: req.body.title })
        .whereNot({ id: topicId })
        .first();
      
      if(topicWithSameName){
        throw {
          message: 'Topic with this title already exists',
          status: 400
        };
      }
    }

    const topic = await Topic.query()
      .update(updatedTopic)
      .where({ userId, id: topicId })
      .returning('*')
      .first();

    if (!topic) {
      return next();
    }
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
      throw {
        message: 'Topic with this title already exists',
        status: 400
      };
    }

    const topic = await Topic.query()
      .insert({ 
        userId, 
        title, 
        parent,
        resourceOrder, 
        lastOpened, 
        notebook 
      })
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

router.delete('/:id', async (req, res, next) => {
  const userId = req.user.id;
  const topicId = req.params.id;

  try {
    const topic = await Topic.query()
      .delete()
      .where({ userId, id: topicId })
      .returning('*')
      .first();
    
    if(!topic) return next();
    return res.sendStatus(204);
  } catch(e) {
    next(e);
  }
});

module.exports = router;
