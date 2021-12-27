const { DataTypes, Model, Op } = require('sequelize')

const sequelize = require('../config/sequelize')

class Chat extends Model {
  static async findActiveIds () {
    const nodes = await Chat.findAll({
      where: {
        status: {
          [Op.ne]: 'kicked'
        },
        type: {
          [Op.ne]: 'channel'
        }
      }
    })

    return nodes.map(it => it.id)
  }
}

Chat.init({
  id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  status: {
    allowNull: false,
    type: DataTypes.ENUM('administrator', 'creator', 'kicked', 'left', 'member', 'restricted')
  },
  type: {
    allowNull: false,
    type: DataTypes.ENUM('channel', 'group', 'private', 'supergroup')
  },
  title: {
    allowNull: true,
    type: DataTypes.STRING
  },
  username: {
    allowNull: true,
    type: DataTypes.STRING
  },
  firstName: {
    allowNull: true,
    type: DataTypes.STRING
  },
  lastName: {
    allowNull: true,
    type: DataTypes.STRING
  }
}, {
  modelName: 'chat',
  sequelize: sequelize
})

module.exports = Chat
