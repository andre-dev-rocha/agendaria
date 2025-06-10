// src/models/User.js

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'employee', 'client'),
      allowNull: false,
    },
    google_calendar_id: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    tableName: 'Users',
    timestamps: true,
  });

  User.associate = (models) => {
    // Um User pode ser dono de muitas Companies (se role = 'admin')
    User.hasMany(models.Company, {
      foreignKey: 'owner_id',
      as: 'ownedCompanies'
    });

    // Um User pode ser funcionário de muitas Companies (através de CompanyEmployees)
    User.belongsToMany(models.Company, {
      through: models.CompanyEmployee,
      foreignKey: 'employee_id',
      otherKey: 'company_id',
      as: 'companiesWorkingFor'
    });

    // Um User (funcionário) oferece muitos Services (através de EmployeeServices)
    User.belongsToMany(models.Service, {
      through: models.EmployeeService,
      foreignKey: 'employee_id',
      otherKey: 'service_id',
      as: 'offeredServices'
    });

    // Um User (funcionário) tem muitas disponibilidades
    User.hasMany(models.EmployeeAvailability, {
      foreignKey: 'employee_id',
      as: 'availabilities'
    });

    // Um User (cliente) tem muitos agendamentos feitos
    User.hasMany(models.Schedule, {
      foreignKey: 'client_id',
      as: 'clientAppointments'
    });

    // Um User (funcionário) tem muitos agendamentos para ele
    User.hasMany(models.Schedule, {
      foreignKey: 'employee_id',
      as: 'employeeAppointments'
    });

    // Um User (cliente) pode dar muitas Reviews
    User.hasMany(models.Review, {
      foreignKey: 'client_id',
      as: 'givenReviews'
    });

    // Um User (funcionário) pode receber muitas Reviews
    User.hasMany(models.Review, {
      foreignKey: 'employee_id',
      as: 'receivedReviews'
    });

    // Um User pode ter muitas Notifications
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });
  };

  return User;
};