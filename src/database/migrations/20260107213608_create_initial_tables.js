exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('full_name').notNullable();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('role').defaultTo('admin');
      table.timestamps(true, true); // Tự động tạo created_at và updated_at
    })
    .createTable('menu_categories', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.integer('display_order').defaultTo(0);
      table.string('status').defaultTo('active');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('menu_categories')
    .dropTableIfExists('users');
};