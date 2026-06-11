"use strict";

module.exports = (sequelize, DataTypes) => {
  const ExamStudent = sequelize.define(
    "ExamStudent",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      exam_id: { type: DataTypes.BIGINT, allowNull: false },
      user_id: { type: DataTypes.BIGINT, allowNull: false },
      result: { type: DataTypes.STRING(10), allowNull: true },
    },
    {
      tableName: "exam_student",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
    }
  );

  ExamStudent.associate = (models) => {
    ExamStudent.belongsTo(models.Exam, { foreignKey: "exam_id" });
    ExamStudent.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return ExamStudent;
};
