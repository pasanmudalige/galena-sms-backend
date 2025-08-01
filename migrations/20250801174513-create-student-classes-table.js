'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('student_classes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      enrollment_qr_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'QR code for this student-class combination'
      },
      enrollment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      card_type: {
        type: Sequelize.ENUM('full_card', 'half_card', 'free_card'),
        defaultValue: 'full_card'
      },
      custom_fee: {
        type: Sequelize.DECIMAL(10, 2)
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'completed'),
        defaultValue: 'active'
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
    await queryInterface.dropTable('student_classes');
  }
};
