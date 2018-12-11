const express = require('express');
const cheerio = require('cheerio');
const got = require('got');
const router = express.Router();

router.get('/', (req, res, next) => {

  const uri = req.body.uri;

  if(!uri){
    const err = new Error('Uri is required');
    err.status = 400;
    return next(err);
  }

  return got(uri)
    .then(response => {
      const $ = cheerio.load(response.body);
      const title = $('title').text();
      return res.json({ title, uri: response.url } );
    })
    .catch(next);
});

module.exports = router;