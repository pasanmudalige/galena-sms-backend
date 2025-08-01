'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('admin123', 10); // change password as needed

    await queryInterface.bulkInsert('users', [
      {
        full_name: 'Admin User',
        email: 'admin@galena.lk',
        password: passwordHash,
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        full_name: 'Staff Member',
        email: 'staff@galena.lk',
        password: passwordHash,
        role: 'staff',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
