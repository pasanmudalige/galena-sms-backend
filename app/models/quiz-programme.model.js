module.exports = (sequelize, Sequelize) => sequelize.define("quiz_programmes", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  teacher_id: { type: Sequelize.INTEGER, allowNull: false },
  title: { type: Sequelize.STRING(255), allowNull: false },
  current_question_index: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  answer_revealed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  is_finished: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
});
