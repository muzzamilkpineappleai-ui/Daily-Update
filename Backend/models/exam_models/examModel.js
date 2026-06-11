"use strict";

module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define(
    "Exam",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      grade_id: { type: DataTypes.BIGINT, allowNull: false },
      group_name: { type: DataTypes.STRING(255), allowNull: false },
      exam_type: { type: DataTypes.STRING(100), allowNull: false },
      exam_date: { type: DataTypes.DATEONLY, allowNull: false },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
    },
    {
      tableName: "exam",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
    }
  );

  Exam.associate = (models) => {
    Exam.belongsTo(models.Grade, { foreignKey: "grade_id" });
    Exam.hasMany(models.ExamStudent, {
      foreignKey: "exam_id",
      onDelete: "CASCADE",
    });
  };

  return Exam;
};
