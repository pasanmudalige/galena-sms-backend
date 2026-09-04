"use strict";

const migration = require("./20250801174517-create-attendance-table");

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((table) =>
      typeof table === "string" ? table.toLowerCase() : String(table.tableName || table).toLowerCase()
    );
    if (!tables.includes("attendances")) await migration.up(queryInterface, Sequelize);
  },
  async down() {
    // Intentionally retained: the original attendance migration owns rollback.
  },
};
