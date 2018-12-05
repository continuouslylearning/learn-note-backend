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
      required: ['email', 'password', 'name'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 5 },
        password: { type: 'string', minLength: 10 },
        email: { type: 'string' }
      }
    };
  }

  validatePassword(password){
    return bcrypt.compare(password, this.password);
  }

  serialize(){
    return {
      id: this.id,
      name: this.name, 
      email: this.email
    };
  }
}

module.exports = User;