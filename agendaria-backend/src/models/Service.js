module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER, // Duração em minutos
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    }
  }, {
    tableName: 'Services',
    timestamps: true,
  });

  Service.associate = (models) => {
    // Um serviço pertence a uma Company
    Service.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company'
    });

    // Um serviço pode ser oferecido por muitos Employees (através da tabela EmployeeServices)
    Service.belongsToMany(models.User, {
      through: models.EmployeeService,
      foreignKey: 'service_id',
      otherKey: 'employee_id',
      as: 'employees'
    });

    // Um serviço pode ter muitos Schedules
    Service.hasMany(models.Schedule, {
      foreignKey: 'service_id',
      as: 'schedules'
    });
  };

  return Service;
};