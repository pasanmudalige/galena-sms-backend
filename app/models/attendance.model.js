module.exports = (sequelize, Sequelize) => {
  const Attendance = sequelize.define("attendance", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    enrollment_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    attendance_datetime: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    attendance_status: {
      type: Sequelize.ENUM("present", "blocked_unpaid", "manual_override"),
      defaultValue: "present",
    },
    entry_method: {
      type: Sequelize.ENUM("qr_scan", "manual", "mobile_app"),
      defaultValue: "qr_scan",
    },
    block_reason: {
      type: Sequelize.STRING(255),
    },
    override_allowed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    override_reason: {
      type: Sequelize.STRING(255),
    },
    override_by: {
      type: Sequelize.INTEGER,
    },
    override_expires_date: {
      type: Sequelize.DATE,
    },
    ip_address: {
      type: Sequelize.STRING(45),
    },
    notes: {
      type: Sequelize.TEXT,
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

  return Attendance;
};
