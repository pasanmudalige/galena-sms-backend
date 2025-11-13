'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      document_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_type: {
        type: Sequelize.ENUM('pdf', 'image'),
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        comment: 'File size in bytes'
      },
      views_per_student: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Maximum number of views allowed per student'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Date when document expires'
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'archived'),
        defaultValue: 'active'
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('documents');
  }
};

