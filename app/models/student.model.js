module.exports = (sequelize, Sequelize) => {
  const Student = sequelize.define("students", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    student_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    student_id: {
      type: Sequelize.STRING(50),
      unique: true,
      allowNull: true,
      comment: "External student ID",
    },
    school: {
      type: Sequelize.STRING(200),
      allowNull: true,
    },
    phone: {
      type: Sequelize.STRING(15),
    },
    parent_phone: {
      type: Sequelize.STRING(15),
    },
    email: {
      type: Sequelize.STRING(100),
    },
    address: {
      type: Sequelize.TEXT,
    },
    status: {
      type: Sequelize.ENUM("active", "inactive"),
      defaultValue: "active",
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

  return Student;
};
