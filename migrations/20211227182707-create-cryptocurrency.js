const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('cryptocurrencies', {
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
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE
      }
    })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('cryptocurrencies')
  }
}
