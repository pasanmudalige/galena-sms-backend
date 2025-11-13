'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('document_classes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      document_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'documents',
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
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Add unique constraint to prevent duplicate document-class assignments
    await queryInterface.addIndex('document_classes', ['document_id', 'class_id'], {
      unique: true,
      name: 'unique_document_class'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('document_classes');
  }
};

