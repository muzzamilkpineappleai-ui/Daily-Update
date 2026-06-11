"use strict";

module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define(
    "Exam",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      grade_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      group_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      exam_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      exam_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "exam",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  Exam.associate = (models) => {
    Exam.belongsTo(models.Grade, {
      foreignKey: "grade_id",
      as: "grade",
    });
  };

  return Exam;
};