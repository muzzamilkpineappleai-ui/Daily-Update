'use strict';

module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define("Attendance", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    slot_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    entry_date: {
      type: DataTypes.STRING,  
      allowNull: false,
    },
    entry_time: {
      type: DataTypes.STRING,  
      allowNull: true,
    },
    attendance_status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['Present', 'Absent', 'Late']],
      },
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
    tableName: "attendance",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.User, { foreignKey: "user_id", as: "User" });
    Attendance.belongsTo(models.Slot, { foreignKey: "slot_id", as: "Slot" });
  };

  return Attendance;
};