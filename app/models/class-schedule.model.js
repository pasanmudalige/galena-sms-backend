module.exports = (sequelize, Sequelize) => {
  const ClassSchedule = sequelize.define("class_schedule", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    class_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
    },
    day_of_week: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "0 = Sunday, 1 = Monday, ..., 6 = Saturday",
    },
    start_time: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    end_time: {
      type: Sequelize.TIME,
      allowNull: true,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
  });

  return ClassSchedule;
};

