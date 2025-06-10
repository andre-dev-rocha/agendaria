module.exports = (sequelize, DataTypes) => {
  const EmployeeService = sequelize.define('EmployeeService', {
    employee_id: {
      type: DataTypes.UUID,
      primaryKey: true, // Parte da chave primária composta
      allowNull: false,
    },
    service_id: {
      type: DataTypes.UUID,
      primaryKey: true, // Parte da chave primária composta
      allowNull: false,
    }
  }, {
    tableName: 'EmployeeServices',
    timestamps: true,
  });

  EmployeeService.associate = (models) => {
    // EmployeeService pertence a um User (que é o funcionário)
    EmployeeService.belongsTo(models.User, { foreignKey: 'employee_id', as: 'employee' });
    // EmployeeService pertence a um Service
    EmployeeService.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  };

  return EmployeeService;
};