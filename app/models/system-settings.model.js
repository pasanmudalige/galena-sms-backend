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
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  });

  return SystemSetting;
};
