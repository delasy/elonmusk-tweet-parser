const Chat = require('./chat')
const Cryptocurrency = require('./cryptocurrency')
const Setting = require('./setting')
const sequelize = require('../config/sequelize')

module.exports = {
  Chat,
  Cryptocurrency,
  Setting,
  sequelize
}
