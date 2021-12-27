const { DataTypes, Model } = require('sequelize')

const sequelize = require('../config/sequelize')

class Cryptocurrency extends Model {
}

Cryptocurrency.init({
  id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  active: {
    allowNull: false,
    type: DataTypes.BOOLEAN
  },
  name: {
    allowNull: false,
    type: DataTypes.STRING
  },
  symbol: {
    allowNull: false,
    type: DataTypes.STRING
  },
  slug: {
    allowNull: false,
    type: DataTypes.STRING
  }
}, {
  modelName: 'cryptocurrency',
  sequelize: sequelize
})

module.exports = Cryptocurrency
