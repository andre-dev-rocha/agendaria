module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schedule_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // Uma avaliação por agendamento
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { // Validação a nível de aplicação
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: 'Reviews',
    timestamps: true,
  });

  Review.associate = (models) => {
    // Uma avaliação pertence a um agendamento
    Review.belongsTo(models.Schedule, {
      foreignKey: 'schedule_id',
      as: 'schedule'
    });

    // Uma avaliação foi feita por um cliente (User)
    Review.belongsTo(models.User, {
      foreignKey: 'client_id',
      as: 'client'
    });

    // Uma avaliação é para um funcionário (User)
    Review.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee'
    });
  };

  return Review;
};