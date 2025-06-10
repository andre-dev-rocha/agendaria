'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('CompanyEmployees', {
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true, // AGORA SIM, está correto para chave composta
        references: {
          model: 'Companies', // Nome da tabela referenciada
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Se a empresa for deletada, as associações de funcionários também
      },
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true, // AGORA SIM, está correto para chave composta
        references: {
          model: 'Users', // Nome da tabela referenciada
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'   // Se o funcionário for deletado, as associações também
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false
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
    await queryInterface.dropTable('CompanyEmployees');
  }
};