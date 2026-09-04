"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((table) =>
      typeof table === "string" ? table.toLowerCase() : String(table.tableName || table).toLowerCase()
    );
    if (tables.includes("students")) return;
    await queryInterface.createTable("students", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(15),
      },
      parent_phone: {
        type: Sequelize.STRING(15),
      },
      email: {
        type: Sequelize.STRING(100),
      },
      address: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("students");
  },
};
