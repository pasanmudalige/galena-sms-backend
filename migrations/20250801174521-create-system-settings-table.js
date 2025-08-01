'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      setting_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      setting_value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('system_settings');
  },
};
