"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'kashmira@galena.lk' LIMIT 1"
    );
    if (rows.length === 0) {
      await queryInterface.bulkInsert("users", [{
        full_name: "Kashmira Karunanayake",
        email: "kashmira@galena.lk",
        password: await bcrypt.hash("Kashmira@123", 10),
        role: "teacher",
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { email: "kashmira@galena.lk", role: "teacher" });
  },
};
