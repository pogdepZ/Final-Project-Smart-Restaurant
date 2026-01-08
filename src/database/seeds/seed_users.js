const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('users').del(); // Xóa dữ liệu cũ
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await knex('users').insert([
    { 
      full_name: 'Admin Test', 
      email: 'admin@test.com', 
      password: hashedPassword,
      role: 'admin'
    }
  ]);
};