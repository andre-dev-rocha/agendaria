'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('EmployeeAvailabilities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // CHECK constraint adicionada via raw query, pois Sequelize.ENUM não se aplica a INTEGER
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      is_recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      effective_date: {
        type: Sequelize.DATEONLY, // Usar DATEONLY para apenas a data
        allowNull: true
      },
      expiration_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
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

    // Adicionar CHECK constraint para day_of_week e start_time < end_time
    await queryInterface.sequelize.query(`
      ALTER TABLE "EmployeeAvailabilities"
      ADD CONSTRAINT check_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6);
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "EmployeeAvailabilities"
      ADD CONSTRAINT check_availability_time_order CHECK (start_time < end_time);
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('EmployeeAvailabilities');
  }
};