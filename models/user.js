const { Model } = require('objection');
const bcrypt = require('bcryptjs');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      email: this.email
    };
  }
}

module.exports = User;
