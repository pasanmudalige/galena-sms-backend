module.exports = (sequelize, Sequelize) => {
  const Payment = sequelize.define("payments", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    enrollment_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    month_year: {
      type: Sequelize.STRING(7),
      allowNull: false,
    },
    expected_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    paid_amount: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    payment_datetime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    payment_status: {
      type: Sequelize.ENUM("pending", "paid", "partial", "overdue"),
      defaultValue: "pending",
    },
    payment_method: {
      type: Sequelize.ENUM("cash", "bank_transfer", "card", "online"),
      allowNull: true,
    },
    due_date: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    transaction_reference: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    notes: {
      type: Sequelize.TEXT,
    },
    received_by: {
      type: Sequelize.INTEGER,
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

  return Payment;
};
