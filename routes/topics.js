const express = require('express');
const Topic = require('../models/topic');

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

router.post('/', (req, res, next) => {
  const userId = req.user.id;

  const { title, parent } = req.body;

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
        .insert({ userId, title, parent })
        .returning('*');
    })
    .then(topic => {
      return res.status(201).json(topic);
    })
    .catch(next);
});


router.delete('/:id', (req, res, next) => {


});

router.use((err, req, res, next) => {
  if(err.code === '23503'){
    err.message = 'Parent id is not valid';
    err.status = 422;
  }
  return next(err);
});

module.exports = router;