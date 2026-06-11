'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    gender: DataTypes.STRING,
    email: DataTypes.STRING,
    phn_num: DataTypes.STRING,
    date_of_birth: DataTypes.STRING,
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_code: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    role_id: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    status: DataTypes.STRING,
  }, 
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at" 
  });

  User.associate = (models) => {

    User.belongsTo(models.Role, { foreignKey: "role_id", as: "Role" });

    User.belongsToMany(models.Slot, {
      through: models.UserSlot,
      foreignKey: "user_id",
      otherKey: "slot_id",
    });

    User.belongsToMany(models.Grade, {
      through: models.UserGrade,
      foreignKey: "user_id",
      otherKey: "grade_id",
      as: "Grades"
    });
  };

  return User;
};