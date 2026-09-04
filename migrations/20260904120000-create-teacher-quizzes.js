"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("admin", "staff", "student", "teacher"),
      defaultValue: "staff",
    });

    await queryInterface.createTable("quiz_programmes", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      teacher_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      title: { type: Sequelize.STRING(255), allowNull: false },
      current_question_index: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      answer_revealed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_finished: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.createTable("quiz_questions", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      quiz_programme_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: "quiz_programmes", key: "id" }, onDelete: "CASCADE" },
      category: { type: Sequelize.STRING(255), allowNull: false, defaultValue: "QUIZ ROUND" },
      question_text: { type: Sequelize.TEXT, allowNull: false },
      time_seconds: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 120 },
      image_path: { type: Sequelize.STRING(500), allowNull: true },
      position: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.createTable("quiz_answers", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      question_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: "quiz_questions", key: "id" }, onDelete: "CASCADE" },
      answer_text: { type: Sequelize.TEXT, allowNull: true },
      image_path: { type: Sequelize.STRING(500), allowNull: true },
      is_correct: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      position: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.createTable("quiz_teams", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      quiz_programme_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: "quiz_programmes", key: "id" }, onDelete: "CASCADE" },
      name: { type: Sequelize.STRING(100), allowNull: false },
      score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      position: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("quiz_teams");
    await queryInterface.dropTable("quiz_answers");
    await queryInterface.dropTable("quiz_questions");
    await queryInterface.dropTable("quiz_programmes");
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("admin", "staff", "student"),
      defaultValue: "staff",
    });
  },
};
