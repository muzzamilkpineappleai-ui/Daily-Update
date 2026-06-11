"use strict";

const {Exam,ExamStudent, Grade,Course,User,StudentDetail, UserGrade,Role, sequelize} = require("../../models/exam_models/index");
const {Op} = require('sequelize');

exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      include: [
        {
          model: Grade,
          include: [{ model: Course }],
        },
        {
          model: ExamStudent,
          include: [
            {
              model: User,
              include: [{ model: StudentDetail }],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(id, {
      include: [
        {
          model: Grade,
          include: [{ model: Course }],
        },
        {
          model: ExamStudent,
          include: [
            {
              model: User,
              include: [{ model: StudentDetail }],
            },
          ],
        },
      ],
    });

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    return res.json(exam);
  } catch (error) {
    console.error(" Error fetching exam:", error);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};

exports.createExam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { grade_id, group_name, exam_type, exam_date, start_time, end_time, student_ids } = req.body;

    // Create the exam
    const exam = await Exam.create(
      { grade_id, group_name, exam_type, exam_date, start_time, end_time },
      { transaction: t }
    );

    // Add selected students (if any) with NULL results initially
    if (student_ids && student_ids.length > 0) {
      const studentRecords = student_ids.map((userId) => ({
        exam_id: exam.id,
        user_id: userId,
        result: null,  // Explicitly set result to NULL initially
      }));

      await ExamStudent.bulkCreate(studentRecords, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: "Exam created successfully", exam });
  } catch (error) {
    await t.rollback();
    console.error(" Error creating exam:", error);
    res.status(500).json({ message: "Failed to create exam" });
  }
};

exports.updateExam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { grade_id, group_name, exam_type, exam_date, start_time, end_time, student_ids } = req.body;

    const exam = await Exam.findByPk(id, { transaction: t });
    if (!exam) {
      await t.rollback();
      return res.status(404).json({ message: "Exam not found" });
    }

    await exam.update(
      { grade_id, group_name, exam_type, exam_date, start_time, end_time },
      { transaction: t }
    );

    if (Array.isArray(student_ids)) {
      await ExamStudent.destroy({ where: { exam_id: id }, transaction: t });

      if (student_ids.length > 0) {
        const newMappings = student_ids.map((userId) => ({
          exam_id: id,
          user_id: userId,
          result: null,  // Explicitly set result to NULL initially
        }));
        await ExamStudent.bulkCreate(newMappings, { transaction: t });
      }
    }

    await t.commit();
    res.json({ message: "Exam updated successfully" });
  } catch (error) {
    await t.rollback();
    console.error(" Error updating exam:", error);
    res.status(500).json({ message: "Failed to update exam" });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await ExamStudent.destroy({ where: { exam_id: id } });
    const deleted = await Exam.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ message: "Exam not found" });

    res.json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error(" Error deleting exam:", error);
    res.status(500).json({ message: "Failed to delete exam" });
  }
};

exports.getStudentsByCourseAndGrade = async (req, res) => {
  try {
    const { courseId, gradeId } = req.query;
    const studentRole = await Role.findOne({
      where: { role_name: { [Op.like]: "%student%" } }
    });

    if (!studentRole) {
      return res.status(404).json({ message: "Student role not found" });
    }

    const students = await User.findAll({
      include: [
        {
          model: UserGrade,
          where: { grade_id: gradeId },
          include: [
            {
              model: Grade,
              where: { course_id: courseId },
            },
          ],
        },
        { model: StudentDetail },
        { model: Role, as: "Role" },
        {
          model: ExamStudent,
          include: [
            {
              model: Exam,
              attributes: ["id", "group_name"],
            },
          ],
        },
      ],
      where: {
        role_id: studentRole.id,
        status: "active",
      },
    });

 
    const formatted = students.map((s) => {
      const plain = s.toJSON();
      plain.group_name =
        plain.ExamStudents && plain.ExamStudents.length > 0
          ? plain.ExamStudents[0].Exam?.group_name || null
          : null;
      return plain;
    });

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};



exports.getSelectedStudents = async (req, res) => {
  try {
    const { examId } = req.params;

    const examStudents = await ExamStudent.findAll({
      where: { exam_id: examId },
      include: [{ model: User, include: [{ model: StudentDetail }] }],
    });

    const selected = examStudents.map((es) => es.user_id);
    res.json({ examId, selected, examStudents });
  } catch (error) {
    console.error("Error fetching selected students:", error);
    res.status(500).json({ message: "Failed to fetch selected students" });
  }
};

exports.getGradesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const grades = await Grade.findAll({
      where: { course_id: courseId },
      attributes: ['id', 'grade_name'], 
      order: [['grade_name', 'ASC']],
    });

    res.json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ message: "Failed to fetch grades" });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    res.json(courses);  
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
};

exports.getExamsByCourseAndGrade = async (req, res) => {
  try {
    const { courseId, gradeId } = req.query;

    let whereCondition = {};
    
    if (courseId && gradeId) {
      // When both courseId and gradeId are provided, verify that the grade belongs to the course
      const grade = await Grade.findByPk(gradeId);
      if (!grade || grade.course_id != courseId) {
        return res.status(400).json({ message: "Grade does not belong to the selected course" });
      }
      whereCondition.grade_id = gradeId;
    } else if (gradeId) {
      // Only gradeId provided
      whereCondition.grade_id = gradeId;
    } else if (courseId) {
      // Only courseId provided - get exams for all grades in the course
      const grades = await Grade.findAll({
        where: { course_id: courseId },
        attributes: ['id']
      });
      const gradeIds = grades.map(grade => grade.id);
      whereCondition.grade_id = { [Op.in]: gradeIds };
    } else {
      // Neither provided - return empty result
      return res.json([]);
    }

    const exams = await Exam.findAll({
      where: whereCondition,
      attributes: ['id', 'group_name', 'exam_type', 'exam_date', 'start_time', 'end_time', 'grade_id'],
      include: [
        {
          model: Grade,
          attributes: ['id', 'grade_name'],
          include: [
            {
              model: Course,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['exam_date', 'ASC'], ['start_time', 'ASC']]
    });

    res.json(exams);
  } catch (error) {
    console.error("Error fetching exams by course and grade:", error);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};