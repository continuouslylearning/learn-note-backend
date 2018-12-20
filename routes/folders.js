const express = require('express');
const Folder = require('../models/folder');
const { requiredFields } = require('./validation/common');
const validateFolder = require('./validation/folder');

const router = express.Router();

router.get('/', (req, res, next) => {
  const userId = req.user.id;
  // Configure ?orderBy
  const shouldOrderByColumn = req.query.orderBy || false;
  // Configure ?orderDirection
  const orderDirection = req.query.orderDirection || 'desc';
  // Configure ?limit
  const limit = req.query.limit;

  Folder.query()
    .where({ userId })
    .modify(query => {
      if (shouldOrderByColumn) query.orderBy(shouldOrderByColumn, orderDirection);
      if (limit) query.limit(limit);
      return query;
    })
    .then(folders => {
      return res.json(folders);
    })
    .catch(next);
});

router.put('/:id', validateFolder, async (req, res, next) => {
  const folderId = req.params.id;
  const userId = req.user.id;
  const { title } = req.body;

  try {
    const folderWithSameName = await Folder
      .query()
      .where({ userId, title })
      .whereNot({ id: folderId })
      .first();

    if(folderWithSameName){
      throw {
        message: 'A folder with this title already exists',
        status: 400
      };
    }
    
    const folder = await Folder
      .query()
      .update({ title })
      .where({ userId, id: folderId })
      .returning('*')
      .first();

    if(!folder) return next();
    return res.status(201).json(folder);
  } catch(e){
    next(e);
  }
});

router.post('/', requiredFields(['title']), validateFolder, (req, res, next) => {
  const userId = req.user.id;
  const { title } = req.body;

  Folder.query()
    .where({ userId, title })
    .first()
    .then(folder => {
      if (folder) {
        const err = new Error('Folder with this title already exists');
        err.status = 400;
        return Promise.reject(err);
      }
      return Folder.query()
        .insert({ title, userId })
        .returning('*');
    })
    .then(folder => {
      return res.status(201).json(folder);
    })
    .catch(next);
});

router.delete('/:id', async (req, res, next) => {
  const userId = req.user.id;
  const folderId = req.params.id;

  try {
    const folder = await Folder.query()
      .delete()
      .where({ userId, id: folderId })
      .returning('*')
      .first();

    if(!folder) return next();
    return res.sendStatus(204);
  } catch(e){
    next(e);
  }
});

module.exports = router;
