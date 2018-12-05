const { Model } = require('objection');

class Folder extends Model {

  static get tableName(){
    return 'folders';
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Folder;