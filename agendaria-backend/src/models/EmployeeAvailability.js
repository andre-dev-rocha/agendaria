module.exports = (sequelize, DataTypes) => {
  const EmployeeAvailability = sequelize.define('EmployeeAvailability', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { // Validação a nível de aplicação
        min: 0, // Domingo
        max: 6  // Sábado
      }
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: { // Validação a nível de aplicação
        isGreaterThanStartTime(value) {
          if (this.start_time && value <= this.start_time) {
            throw new Error('End time must be after start time.');
          }
        }
      }
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    effective_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expiration_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    }
  }, {
    tableName: 'EmployeeAvailabilities',
    timestamps: true,
  });

  EmployeeAvailability.associate = (models) => {
    // A disponibilidade pertence a um User (funcionário)
    EmployeeAvailability.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee'
    });
  };

  return EmployeeAvailability;
};