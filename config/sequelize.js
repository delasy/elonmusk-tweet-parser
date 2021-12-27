const { Sequelize } = require('sequelize')

const config = require('./database')[process.env.NODE_ENV ?? 'development']

module.exports = Object.prototype.hasOwnProperty.call(config, 'use_env_variable')
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config)
