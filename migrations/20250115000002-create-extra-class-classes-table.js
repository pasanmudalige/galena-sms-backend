'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('extra_class_classes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      extra_class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'extra_classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add unique constraint to prevent duplicate class assignments
    await queryInterface.addIndex('extra_class_classes', ['extra_class_id', 'class_id'], {
      unique: true,
      name: 'unique_extra_class_class'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('extra_class_classes');
  }
};

