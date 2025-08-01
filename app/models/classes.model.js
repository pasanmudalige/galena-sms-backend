module.exports = (sequelize, Sequelize) => {
  const Class = sequelize.define("classes", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    class_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    class_code: {
      type: Sequelize.STRING(50),
      unique: true,
    },
    class_fee: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    teacher_name: {
      type: Sequelize.STRING(100),
    },
    description: {
      type: Sequelize.TEXT,
    },
    max_capacity: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    },
  });

  return Class;
};
