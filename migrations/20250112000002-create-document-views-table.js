'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('document_views', {
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
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      viewed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      ip_address: {
        type: Sequelize.STRING(45),
        comment: 'IP address of the viewer'
      },
      user_agent: {
        type: Sequelize.TEXT,
        comment: 'User agent string'
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

    // Add index for faster queries
    await queryInterface.addIndex('document_views', ['document_id', 'student_id'], {
      name: 'idx_document_student'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('document_views');
  }
};

