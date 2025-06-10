module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    service_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: { // Validação a nível de aplicação para garantir start_time < end_time
        isGreaterThanStartTime(value) {
          if (this.start_time && value <= this.start_time) {
            throw new Error('End time must be after start time.');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'canceled', 'completed'),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    google_calendar_event_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }
  }, {
    tableName: 'Schedules',
    timestamps: true,
  });

  Schedule.associate = (models) => {
    // Um agendamento pertence a um cliente (User)
    Schedule.belongsTo(models.User, {
      foreignKey: 'client_id',
      as: 'client'
    });

    // Um agendamento pertence a um funcionário (User)
    Schedule.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee'
    });

    // Um agendamento pertence a um serviço
    Schedule.belongsTo(models.Service, {
      foreignKey: 'service_id',
      as: 'service'
    });

    // Um agendamento pode ter uma avaliação
    Schedule.hasOne(models.Review, {
      foreignKey: 'schedule_id',
      as: 'review'
    });
  };

  return Schedule;
};