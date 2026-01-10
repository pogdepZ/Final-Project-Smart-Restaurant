require('dotenv').config();

const commonConfig = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './src/database/seeds'
  }
};

module.exports = {
  development: commonConfig,
  staging: commonConfig,
  production: commonConfig
};