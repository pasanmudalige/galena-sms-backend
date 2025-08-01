'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      enrollment_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      month_year: {
        type: Sequelize.STRING(7),
        allowNull: false
      },
      expected_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paid_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      payment_datetime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'partial', 'overdue'),
        defaultValue: 'pending'
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'card', 'online'),
        allowNull: true
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      transaction_reference: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT
      },
      received_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
