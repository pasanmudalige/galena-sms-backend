'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('students', 'pending_access', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'True if student registered but access not yet granted',
    });

    await queryInterface.addColumn('students', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Foreign key to users table for login credentials',
    });

    // Add foreign key constraint
    await queryInterface.addConstraint('students', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'students_user_id_fk',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('students', 'students_user_id_fk');
    await queryInterface.removeColumn('students', 'pending_access');
    await queryInterface.removeColumn('students', 'user_id');
  },
};


