'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((table) =>
      typeof table === "string" ? table.toLowerCase() : String(table.tableName || table).toLowerCase()
    );
    if (tables.includes("classes")) return;
    await queryInterface.createTable('classes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      class_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      class_code: {
        type: Sequelize.STRING(50),
        unique: true
      },
      class_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      teacher_name: {
        type: Sequelize.STRING(100)
      },
      description: {
        type: Sequelize.TEXT
      },
      max_capacity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
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
    await queryInterface.dropTable('classes');
  }
};
