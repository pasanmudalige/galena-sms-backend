module.exports = (sequelize, Sequelize) => sequelize.define("quiz_questions", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  quiz_programme_id: { type: Sequelize.INTEGER, allowNull: false },
  category: { type: Sequelize.STRING(255), allowNull: false, defaultValue: "QUIZ ROUND" },
  question_text: { type: Sequelize.TEXT, allowNull: false },
  time_seconds: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 120 },
  image_path: { type: Sequelize.STRING(500), allowNull: true },
  position: { type: Sequelize.INTEGER, allowNull: false },
});
