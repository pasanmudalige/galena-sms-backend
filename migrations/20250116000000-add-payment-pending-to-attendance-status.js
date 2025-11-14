'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'payment_pending' to attendance_status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE attendances 
      MODIFY COLUMN attendance_status 
      ENUM('present', 'blocked_unpaid', 'manual_override', 'payment_pending') 
      DEFAULT 'present';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert back to original ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE attendances 
      MODIFY COLUMN attendance_status 
      ENUM('present', 'blocked_unpaid', 'manual_override') 
      DEFAULT 'present';
    `);
  }
};

