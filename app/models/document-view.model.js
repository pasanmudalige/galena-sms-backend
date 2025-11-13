module.exports = (sequelize, Sequelize) => {
  const DocumentView = sequelize.define("document_views", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    document_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    student_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    viewed_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    ip_address: {
      type: Sequelize.STRING(45),
      comment: "IP address of the viewer",
    },
    user_agent: {
      type: Sequelize.TEXT,
      comment: "User agent string",
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

  return DocumentView;
};

