module.exports = (sequelize, Sequelize) => sequelize.define("quiz_answers", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  question_id: { type: Sequelize.INTEGER, allowNull: false },
  answer_text: { type: Sequelize.TEXT, allowNull: true },
  image_path: { type: Sequelize.STRING(500), allowNull: true },
  is_correct: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  position: { type: Sequelize.INTEGER, allowNull: false },
});
