'use strict';

module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define('Branch', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    country: DataTypes.STRING,
    branch_name: DataTypes.STRING,
    currency: { type: DataTypes.STRING(255), allowNull: false }
  }, {
    tableName: 'branch',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Branch.associate = (models) => {
    Branch.belongsToMany(models.User, {
      through: models.UserBranch,
      foreignKey: 'branch_id',
      otherKey: 'user_id',
      as: 'Users'
    });
    Branch.hasMany(models.Slot, { foreignKey: 'branch_id', as: 'Slot' });
    Branch.hasMany(models.UserBranch, { foreignKey: 'branch_id', as: 'UserBranches' });
    Branch.hasMany(models.UserBranchHistory, { foreignKey: 'branch_id', as: 'UserBranchHistories' });
  };

  return Branch;
};