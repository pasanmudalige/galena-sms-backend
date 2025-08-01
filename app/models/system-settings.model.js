module.exports = (sequelize, Sequelize) => {
  const SystemSetting = sequelize.define("system_settings", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    setting_key: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    setting_value: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
  });

  return SystemSetting;
};
