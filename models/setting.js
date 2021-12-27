const { DataTypes, Model } = require('sequelize')

const sequelize = require('../config/sequelize')

class Setting extends Model {
  static async get (name) {
    return await Setting.findOne({
      where: { name }
    })
  }

  static async set (name, value) {
    return await Setting.upsert({ name, value })
  }
}

Setting.init({
  name: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING
  },
  value: {
    allowNull: true,
    type: DataTypes.STRING
  }
}, {
  modelName: 'setting',
  sequelize: sequelize
})

module.exports = Setting
