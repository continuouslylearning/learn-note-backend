const express = require('express');
const Topic = require('../models/topic');
const Folder = require('../models/folder');
const validateTopic = require('./validation/topic');

const router = express.Router();

router.get('/', (req, res, next) => {

  const userId = req.user.id;
  
  return Folder
    .query()
    .select(
      'topics.id as id', 
      'topics.userId',
      'topics.parent as parent', 
      'topics.title',
      'notebook', 
      'resourceOrder', 
      'topics.createdAt',
      'topics.updatedAt',
      'folders.title as folderTitle'
    )
    .rightJoin('topics', 'folders.id', 'topics.parent')
    .where({ 'topics.userId': userId })
    .then(topics => {
      topics.forEach(topic => {
        topic.parent = {
          id: topic.parent,
          title: topic.folderTitle,
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
  const showNotebook = req.query.notebook;

  return Folder
    .query()
    .select(
      'topics.id as id', 
      'topics.userId',
      'topics.parent as folderId', 
      'topics.title',
      'notebook', 
      'resourceOrder', 
      'topics.createdAt',
      'topics.updatedAt',
      'folders.title as folderTitle',
      'resources.id as resourceId', 
      'resources.title as resourceTitle', 
      'type',
      'uri', 
      'completed', 
      'resources.lastOpened as lastOpened'
    )
    .rightJoin('topics', 'folders.id', 'topics.parent')
    .leftJoin('resources', 'topics.id', 'resources.parent')
    .where({ 'topics.userId': userId, 'topics.id': topicId })
    .then(results => {
      if(!results.length) return Promise.reject();

      const item = results[0];

      const topic = {
        id: item.id,
        userId: item.userId,
        title: item.title,
        parent: {
          id: item.folderId,
          title: item.folderTitle
        },
        notebook: item.notebook,
        resourceOrder: item.resourceOrder,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        resources: []
      };

      results.forEach(item => {
        topic.resources.push({
          id: item.resourceId,
          title: item.resourceTitle,
          type: item.type,
          uri: item.uri,
          completed: item.completed,
          lastOpened: item.lastOpened
        });
      });

      if(showNotebook !== 'true') delete topic.notebook;

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
    if(field in req.body){
      updatedTopic[field] = req.body[field];
    }
  });

  return Topic
    .query()
    .update(updatedTopic)
    .where({ userId, id: topicId })
    .returning('*')
    .first()
    .then(topic => {
      if(!topic){
        return Promise.reject();
      }
      return res.status(201).json(topic);
    })
    .catch(next);

});

router.post('/', validateTopic, (req, res, next) => {
  const userId = req.user.id;

  const { title, parent, resourceOrder, lastOpened, notebook } = req.body;

  Topic.query()
    .where({ userId, title })
    .first()
    .then(topic => {
      if(topic){
        const err = new Error('Topic with this title already exists');
        err.status = 422;
        return Promise.reject(err);
      }
      return Topic.query()
        .insert({ userId, title, parent, resourceOrder, lastOpened, notebook })
        .returning('*');
    })
    .then(topic => {
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
      if(!topic) return Promise.reject();
      return res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;