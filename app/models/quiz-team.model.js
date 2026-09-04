module.exports = (sequelize, Sequelize) => sequelize.define("quiz_teams", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  quiz_programme_id: { type: Sequelize.INTEGER, allowNull: false },
  name: { type: Sequelize.STRING(100), allowNull: false },
  score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  position: { type: Sequelize.INTEGER, allowNull: false },
});
