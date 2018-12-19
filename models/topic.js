const { Model } = require('objection');

class Topic extends Model {

  static get tableName(){
    return 'topics';
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }

  appendParent(){

    if(this.parent && this.folderTitle){
      this.parent = {
        id: this.parent,
        title: this.folderTitle
      };
      delete this.folderTitle;
    } else {
      this.parent = null;
    }
  }
}

module.exports = Topic;