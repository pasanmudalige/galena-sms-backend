module.exports = (sequelize, Sequelize) => {
  //this is also known as enrolment table and entrolment id is the primary key of this table
  const StudentClass = sequelize.define("student_classes", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    student_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    class_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    enrollment_qr_code: {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
      comment: "QR code for this student-class combination",
    },
    enrollment_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    card_type: {
      type: Sequelize.ENUM("full_card", "half_card", "free_card"),
      defaultValue: "full_card",
    },
    custom_fee: {
      type: Sequelize.DECIMAL(10, 2),
    },
    status: {
      type: Sequelize.ENUM("active", "inactive", "completed"),
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

  return StudentClass;
};
