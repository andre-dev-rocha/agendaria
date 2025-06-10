'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('EmployeeServices', {
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true, // AGORA SIM, está correto para chave composta
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true, // AGORA SIM, está correto para chave composta
        references: {
          model: 'Services',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    // REMOVA A LINHA: await queryInterface.addConstraint(...) pois não é mais necessária
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('EmployeeServices');
  }
};