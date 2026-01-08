const bcrypt = require('bcryptjs');
exports.seed = async function(knex) {
  await knex('users').del();
  const hashedPassword = await bcrypt.hash('123456', 10);
  await knex('users').insert([
    { full_name: 'Quản trị viên', email: 'admin@test.com', password: hashedPassword, role: 'admin' }
  ]);
};