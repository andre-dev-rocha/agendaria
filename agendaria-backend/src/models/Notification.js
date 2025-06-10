module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    related_id: {
      type: DataTypes.UUID,
      allowNull: true, // Pode ser o ID de um Schedule, CompanyEmployee, etc.
    }
  }, {
    tableName: 'Notifications',
    timestamps: true,
  });

  Notification.associate = (models) => {
    // Uma notificação pertence a um User
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    // Se 'related_id' precisar de associação, isso seria feito aqui (polimórfica, mais avançado)
  };

  return Notification;
};