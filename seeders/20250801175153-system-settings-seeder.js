'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('system_settings', [
      {
        setting_key: 'site_name',
        setting_value: 'Galena Education',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        setting_key: 'support_email',
        setting_value: 'support@galena.lk',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        setting_key: 'default_language',
        setting_value: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('system_settings', null, {});
  },
};
