const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: "mysql",
});


const Grade = sequelize.define(
  "Grade",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    grade_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "grade",
    timestamps: false,
  }
);

// -----------------------
// EXAM MODEL
// -----------------------
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    exam_type: {
      type: DataTypes.STRING,
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
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "exam",
    timestamps: false,
  }
);


Exam.belongsTo(Grade, { foreignKey: "grade_id" });
Grade.hasMany(Exam, { foreignKey: "grade_id" });


module.exports = { sequelize, Exam, Grade };
