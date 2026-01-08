exports.up = function(knex) {
  return knex.schema
    // 1. Danh mục
    .createTable('menu_categories', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.integer('display_order').defaultTo(0);
      table.string('status').defaultTo('active'); // active, inactive
      table.timestamps(true, true);
    })
    // 2. Món ăn
    .createTable('menu_items', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('category_id').references('id').inTable('menu_categories').onDelete('CASCADE');
      table.string('name').notNullable();
      table.decimal('price', 12, 2).notNullable();
      table.text('description');
      table.integer('prep_time_minutes').defaultTo(0);
      table.string('status').defaultTo('available'); // available, sold_out, unavailable
      table.boolean('is_chef_recommended').defaultTo(false);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    })
    // 3. Nhóm Topping (VD: Size, Thêm món...)
    .createTable('modifier_groups', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('selection_type').defaultTo('single'); // single, multiple
      table.boolean('is_required').defaultTo(false);
      table.timestamps(true, true);
    })
    // 4. Lựa chọn của Topping (VD: Size L + 10k)
    .createTable('modifier_options', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('group_id').references('id').inTable('modifier_groups').onDelete('CASCADE');
      table.string('name').notNullable();
      table.decimal('price_adjustment', 12, 2).defaultTo(0);
      table.timestamps(true, true);
    })
    // 5. Bảng trung gian Món ăn <-> Topping
    .createTable('menu_item_modifier_groups', (table) => {
      table.uuid('menu_item_id').references('id').inTable('menu_items').onDelete('CASCADE');
      table.uuid('modifier_group_id').references('id').inTable('modifier_groups').onDelete('CASCADE');
      table.primary(['menu_item_id', 'modifier_group_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('menu_item_modifier_groups')
    .dropTableIfExists('modifier_options')
    .dropTableIfExists('modifier_groups')
    .dropTableIfExists('menu_items')
    .dropTableIfExists('menu_categories');
};