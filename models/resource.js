const { Model } = require('objection');

class Resource extends Model {

  static get tableName(){
    return 'resources';
  }

  normalize(){
    const normalized = {
      id: this.id,
      title: this.title,
      uri: this.uri,
      type: this.type,
      completed: this.completed,
      lastOpened: this.lastOpened,
      parent: null
    };

    if(this.parentId && this.parentTitle){
      normalized.parent = {
        id: this.parentId,
        title: this.parentTitle
      };
    }

    return normalized;
  }
}

module.exports = Resource;