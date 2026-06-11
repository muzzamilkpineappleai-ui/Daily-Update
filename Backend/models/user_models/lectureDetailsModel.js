const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LecturerDetails = sequelize.define('LecturerDetails', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    photo_url: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '/default-avatar.png',
    },
    ice_contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    salutation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'lecturer_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  LecturerDetails.associate = (models) => {
    LecturerDetails.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
  };

  return LecturerDetails;
};