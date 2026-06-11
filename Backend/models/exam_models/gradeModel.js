"use strict";

module.exports = (sequelize, DataTypes) => {
  const Grade = sequelize.define(
    "Grade",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      course_id: { type: DataTypes.BIGINT, allowNull: false },
      grade_name: { type: DataTypes.STRING(255), allowNull: false },
    },
    {
      tableName: "grade",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  Grade.associate = (models) => {
    Grade.belongsTo(models.Course, { foreignKey: "course_id" });
    Grade.hasMany(models.Exam, { foreignKey: "grade_id" });
  };

  return Grade;
};
