module.exports = (sequelize, Sequelize) => {
  const ExtraClassClass = sequelize.define("extra_class_class", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    extra_class_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "extra_classes",
        key: "id",
      },
    },
    class_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
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

  return ExtraClassClass;
};

