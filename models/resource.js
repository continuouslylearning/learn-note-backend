const { Model } = require('objection');
const Topic = require('./topic');

class Resource extends Model {


  static get tableName(){
    return 'resources';
  }
}

module.exports = Resource;