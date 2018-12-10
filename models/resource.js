const { Model } = require('objection');

class Resource extends Model {


  static get tableName(){
    return 'resources';
  }
}

module.exports = Resource;