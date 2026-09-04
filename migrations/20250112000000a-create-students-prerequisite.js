"use strict";

const migration = require("./20250801173922-create-student-table");

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((table) =>
      typeof table === "string" ? table.toLowerCase() : String(table.tableName || table).toLowerCase()
    );
    if (!tables.includes("students")) await migration.up(queryInterface, Sequelize);
  },
  async down() {
    // Intentionally retained: the original student migration owns rollback.
  },
};
