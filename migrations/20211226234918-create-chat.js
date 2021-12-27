const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('chats', {
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
      first_name: {
        allowNull: true,
        type: DataTypes.STRING
      },
      last_name: {
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
    await queryInterface.dropTable('chats')
  }
}
