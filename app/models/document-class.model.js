module.exports = (sequelize, Sequelize) => {
  const DocumentClass = sequelize.define("document_classes", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    document_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    class_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
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

  return DocumentClass;
};

