"use strict";

const migration = require("./20250801174511-create-classes-table");

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((table) =>
      typeof table === "string" ? table.toLowerCase() : String(table.tableName || table).toLowerCase()
    );
    if (!tables.includes("classes")) await migration.up(queryInterface, Sequelize);
  },
  async down() {
    // Intentionally retained: the original classes migration owns rollback.
  },
};
