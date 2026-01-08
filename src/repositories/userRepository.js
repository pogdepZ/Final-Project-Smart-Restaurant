const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    return db('users').where({ email }).first();
  }

  async findById(id) {
    return db('users').where({ id }).first();
  }

  // Hàm để lưu user vào DB
  async create(userData) {
    const [newUser] = await db('users').insert(userData).returning('*');
    return newUser;
  }
}

module.exports = new UserRepository();