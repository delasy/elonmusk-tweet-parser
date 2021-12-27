require('dotenv').config()

module.exports = {
  development: {
    define: {
      underscored: true
    },
    dialect: 'postgres',
    migrationStoragePath: 'sequelize',
    migrationStorageTableName: 'sequelize_migrations',
    use_env_variable: 'DATABASE_URL'
  },
  production: {
    define: {
      underscored: true
    },
    dialectOptions: {
      keepAlive: true,
      ssl: {
        rejectUnauthorized: false,
        require: true
      }
    },
    dialect: 'postgres',
    logging: false,
    migrationStoragePath: 'sequelize',
    migrationStorageTableName: 'sequelize_migrations',
    ssl: true,
    use_env_variable: 'DATABASE_URL'
  }
}
