const { Model } = require('objection');

class Resource extends Model {

  static get tableName(){
    return 'resources';
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Resource;