const express = require('express');
const Topic = require('../models/topic');
const validateTopic = require('./validation/topic');

const router = express.Router();

router.get('/', (req, res, next) => {

  const userId = req.user.id;
  
  return Topic.query()
    .where({ userId })
    .then(topics => {
      return res.json(topics);
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

  return Topic.query()
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
        const err = new Error('Topic with this name already exists');
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