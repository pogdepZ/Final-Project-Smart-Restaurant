exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('full_name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('role').defaultTo('admin'); // admin, waiter, kitchen
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};