const { Model } = require('objection');

class Topic extends Model {

  static get tableName(){
    return 'topics';
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Topic;