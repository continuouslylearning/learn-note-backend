const { Model } = require('objection');
const bcrypt = require('bcryptjs');

class User extends Model {

  static get tableName(){
    return 'users';
  }

  // hash password before inserting user record into the database
  static hashPassword(password){
    return bcrypt.hash(password, 10);
  }
  // validate user instances
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'password'],

      properties: {
        id: { type: 'integer' },
        username: { type: 'string', minLength: 5 },
        password: { type: 'string', minLength: 10 }
      }
    };
  }

  validatePassword(password){
    return bcrypt.compare(password, this.password);
  }

  serialize(){
    return {
      id: this.id,
      username: this.username
    };
  }
}

module.exports = User;