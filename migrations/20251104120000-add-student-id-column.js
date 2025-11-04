"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("students", "student_id", {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true,
      comment: "External student ID",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("students", "student_id");
  },
};


