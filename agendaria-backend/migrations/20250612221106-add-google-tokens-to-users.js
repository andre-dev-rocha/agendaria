'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'google_access_token', {
      type: Sequelize.STRING,
      allowNull: true // Pode ser nulo se o usuário não conectou o Google Calendar
    });
    await queryInterface.addColumn('Users', 'google_refresh_token', {
      type: Sequelize.STRING,
      allowNull: true // Pode ser nulo
    });
    await queryInterface.addColumn('Users', 'google_token_expiry_date', {
      type: Sequelize.DATE,
      allowNull: true // Data de expiração do access token
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'google_access_token');
    await queryInterface.removeColumn('Users', 'google_refresh_token');
    await queryInterface.removeColumn('Users', 'google_token_expiry_date');
  }
};