"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
    first_name: { type: DataTypes.STRING(255), allowNull: false },
    last_name: { type: DataTypes.STRING(255), allowNull: false },
    gender: { type: DataTypes.STRING(255), allowNull: false },
    username: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    phn_num: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    address: { type: DataTypes.STRING(255), allowNull: false },
    id_code: {type: DataTypes.TEXT,allowNull: false,unique: true },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
    role_id: { type: DataTypes.INTEGER,allowNull: false,references: {model: 'roles',key: 'id'}},
    status: { type: DataTypes.STRING(255), allowNull: false }
  }, 
    {
      tableName: "users",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  User.associate = (models) => {
    User.hasOne(models.StudentDetail, { foreignKey: "user_id" });
    User.hasMany(models.UserGrade, { foreignKey: "user_id" });
    User.hasMany(models.ExamStudent, { foreignKey: "user_id" });
    User.belongsTo(models.Role, { foreignKey: "role_id", as: "Role" });
  };

  return User;
};
