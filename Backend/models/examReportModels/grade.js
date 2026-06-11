"use strict";

module.exports = (sequelize, DataTypes) => {
  const Grade = sequelize.define(
    "Grade",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      grade_name: {
        type: DataTypes.STRING(100),
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
      tableName: "grade",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  Grade.associate = (models) => {
    // Only add this line IF you have a Course model in the same folder
    if (models.Course) {
      Grade.belongsTo(models.Course, {
        foreignKey: "course_id",
        as: "course",
      });
    }

    Grade.hasMany(models.Exam, {
      foreignKey: "grade_id",
      as: "exams",
    });
  };

  return Grade;
};