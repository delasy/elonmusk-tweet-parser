const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('settings', {
      name: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING
      },
      value: {
        allowNull: true,
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
    await queryInterface.dropTable('settings')
  }
}
