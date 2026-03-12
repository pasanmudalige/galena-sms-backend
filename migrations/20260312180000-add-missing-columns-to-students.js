"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("students", "school", {
      type: Sequelize.STRING(200),
      allowNull: true,
    });

    await queryInterface.addColumn("students", "year_of_al", {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: "Year of Advanced Level",
    });

    await queryInterface.addColumn("students", "hear_about_us", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Where did you hear about us (JSON array of selected options)",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("students", "hear_about_us");
    await queryInterface.removeColumn("students", "year_of_al");
    await queryInterface.removeColumn("students", "school");
  },
};