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
        username: { type: 'string', minLength: 5, maxLength: 20 },
        password: { type: 'string', minLength: 10, maxLength: 20 }
      }
    };
  }
}

module.exports = User;