'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('class_schedules', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '0 = Sunday, 1 = Monday, ..., 6 = Saturday'
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Add unique constraint to prevent duplicate schedules for same class/day/time
    await queryInterface.addIndex('class_schedules', ['class_id', 'day_of_week', 'start_time'], {
      unique: true,
      name: 'unique_class_day_time'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('class_schedules');
  }
};

