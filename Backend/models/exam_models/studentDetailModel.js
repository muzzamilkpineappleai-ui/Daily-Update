"use strict";

module.exports = (sequelize, DataTypes) => {
  const StudentDetail = sequelize.define(
    "StudentDetail",
    {
    id: { type: 
      DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    user_id: { type: 
      DataTypes.INTEGER, 
      allowNull: false, 
      unique: true 
    },
    salutation:{ type:
      DataTypes.STRING,
      allowNull:true
    } ,
    ice_contact: DataTypes.STRING,
    student_no: { type: 
      DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    photo_url: DataTypes.STRING
  },
    {
      tableName: "student_details",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  StudentDetail.associate = (models) => {
    StudentDetail.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return StudentDetail;
};
