module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }
  }, {
    tableName: 'Companies',
    timestamps: true,
  });

  Company.associate = (models) => {
    // Uma empresa pertence a um User (owner)
    Company.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner' // Alias para quando for buscar o relacionamento
    });

    // Uma empresa tem muitos Services
    Company.hasMany(models.Service, {
      foreignKey: 'company_id',
      as: 'services'
    });

    // Uma empresa tem muitos Employees (através da tabela CompanyEmployees)
    Company.belongsToMany(models.User, {
      through: models.CompanyEmployee,
      foreignKey: 'company_id',
      otherKey: 'employee_id',
      as: 'employees'
    });
  };

  return Company;
};