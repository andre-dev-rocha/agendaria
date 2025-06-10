module.exports = (sequelize, DataTypes) => {
  const CompanyEmployee = sequelize.define('CompanyEmployee', {
    company_id: {
      type: DataTypes.UUID,
      primaryKey: true, // Parte da chave primária composta
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.UUID,
      primaryKey: true, // Parte da chave primária composta
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
    }
  }, {
    tableName: 'CompanyEmployees',
    timestamps: true,
    // Definir explicitly a chave primária composta aqui também para o modelo
    // embora no relacionamento belongsToMany ele já saiba usar o 'through' model
    // indexes: [{ unique: true, fields: ['company_id', 'employee_id'] }] // Não precisa de index se já é PK
  });

  CompanyEmployee.associate = (models) => {
    // CompanyEmployee pertence a uma Company
    CompanyEmployee.belongsTo(models.Company, { foreignKey: 'company_id' });
    // CompanyEmployee pertence a um User (que é o funcionário)
    CompanyEmployee.belongsTo(models.User, { foreignKey: 'employee_id', as: 'employee' });
  };

  return CompanyEmployee;
};