const db = require("../../models/exam_models/index");

// =======================================
// GET ALL COURSES
// =======================================
const getCourses = async (req, res) => {
  try {
    const courses = await db.Course.findAll({
      attributes: ["id", "name"],
    });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =======================================
// GET GRADES BY COURSE
// =======================================
const getGradesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const grades = await db.Grade.findAll({
      where: { course_id: courseId },
      attributes: ["id", "grade_name"],
    });

    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =======================================
// GET STUDENTS BY GRADE
// =======================================
const getStudentsForResults = async (req, res) => {
  try {
    const { grade_id } = req.query;

    if (!grade_id) {
      return res.status(400).json({ message: "grade_id is required" });
    }

    const students = await db.User.findAll({
      where: { status: "active" },
      attributes: ["id", "first_name", "last_name"],
      include: [
        {
          model: db.UserGrade,
          as: "UserGrades",
          required: true,
          where: { grade_id },
          include: [
            {
              model: db.Grade,
              as: "Grade",
              attributes: ["id", "grade_name", "course_id"],
            },
          ],
        },
      ],
    });

    res.status(200).json(students);
  } catch (error) {
    console.error("❌ FULL ERROR:", error);
    console.error("❌ SQL:", error.parent?.sqlMessage);

    res.status(500).json({
      error: error.message,
      sqlError: error.parent?.sqlMessage,
    });
  }
};

// =======================================
// SAVE RESULTS
// =======================================
const saveResults = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { exam_id, results } = req.body;

    if (!exam_id || !Array.isArray(results)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    for (const row of results) {
      if (!row.user_id || row.result === undefined) { // Allow empty strings and 'AB' as valid results
        throw new Error("user_id and result are required");
      }

      // First, delete any existing records for this student-exam combination
      // This ensures we don't have duplicates
      await db.ExamStudent.destroy({
        where: {
          exam_id: exam_id,
          user_id: row.user_id
        },
        transaction
      });
      
      // Then create a new record with the result
      await db.ExamStudent.create(
        {
          exam_id: exam_id,
          user_id: row.user_id,
          result: row.result
        },
        { transaction }
      );
    }

    await transaction.commit();
    res.status(200).json({ message: "Results saved successfully" });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// GET ALL GRADES
// ===============================
const getAllGrades = async (req, res) => {
  try {
    const grades = await db.Grade.findAll({
      attributes: ["id", "grade_name", "course_id"],
      order: [["grade_name", "ASC"]],
    });

    res.status(200).json(grades);
  } catch (error) {
    console.error("❌ Error fetching grades:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// GET ALL RESULTS
// ===============================
const getAllResults = async (req, res) => {
  try {
    // 1️⃣ Find all exams
    const exams = await db.Exam.findAll({
      attributes: ["id", "group_name", "exam_type", "exam_date", "start_time", "end_time", "grade_id"]
    });

    if (!exams.length) {
      return res.json({ students: [], exams: [] });
    }

    const examIds = exams.map(exam => exam.id);

    // 2️⃣ Get all exam_student records
    const examResults = await db.sequelize.query(
      `SELECT es.exam_id, es.user_id, es.result, u.first_name, u.last_name, g.grade_name 
       FROM exam_student es 
       JOIN users u ON es.user_id = u.id 
       JOIN user_grade ug ON u.id = ug.user_id
       JOIN grade g ON ug.grade_id = g.id
       WHERE es.exam_id IN (${examIds.map(() => ':examId').join(',')}) 
       AND u.status = 'active'`,
      {
        replacements: { examId: examIds },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    // 3️⃣ Create a result map for easy lookup
    const resultMap = {};
    examResults.forEach(r => {
      if (!resultMap[r.user_id]) resultMap[r.user_id] = {};
      resultMap[r.user_id][r.exam_id] = r.result;
    });

    // 4️⃣ Get all users with their grades
    const users = await db.User.findAll({
      include: [
        {
          model: db.UserGrade,
          as: "UserGrades",
          include: [
            {
              model: db.Grade,
              as: "Grade",
              attributes: ["id", "grade_name", "course_id"],
            },
          ],
        },
      ],
      attributes: ["id", "first_name", "last_name"],
    });

    // 5️⃣ Combine the data
    const resultData = [];
    users.forEach(user => {
      user.UserGrades.forEach(userGrade => {
        // Find exams for this user's grade
        const userGradeExams = exams.filter(exam => exam.grade_id === userGrade.grade_id);
        
        userGradeExams.forEach(exam => {
          // Only add to results if there's an actual result (not '-')
          const actualResult = resultMap[user.id] && resultMap[user.id][exam.id] ? resultMap[user.id][exam.id] : '-';
          if (actualResult && actualResult !== '-' && actualResult.trim() !== '') {
            resultData.push({
              user_id: `${user.id}-${exam.id}`, // Unique ID for each student-exam combination
              user_name: `${user.first_name} ${user.last_name}`,
              results: { [exam.id]: actualResult },
              exam_id: exam.id,
              exam_name: exam.group_name,
              exam_type: exam.exam_type,
              grade_name: userGrade.Grade.grade_name
            });
          }
        });
      });
    });

    res.json({
      students: resultData,
      exams: exams
    });

  } catch (error) {
    console.error("❌ Error fetching all results:", error);
    res.status(500).json({ error: error.message });
  }
};


// ===============================
// GET RESULTS BY GRADE
// ===============================
const getResultsByGrade = async (req, res) => {
  try {
    const { grade_id } = req.query;

    if (!grade_id) {
      return res.status(400).json({ message: "grade_id is required" });
    }

    // 1️⃣ Find all exams for this grade
    const exams = await db.Exam.findAll({
      where: { grade_id: grade_id },
      attributes: ["id", "group_name", "exam_type", "exam_date", "start_time", "end_time"]
    });

    if (!exams.length) {
      return res.json([]);
    }

    const examIds = exams.map(exam => exam.id);

    // 2️⃣ Get all exam_student records for these exams
    const examResults = await db.sequelize.query(
      `SELECT es.exam_id, es.user_id, es.result, u.first_name, u.last_name 
       FROM exam_student es 
       JOIN users u ON es.user_id = u.id 
       WHERE es.exam_id IN (${examIds.map(() => ':examId').join(',')}) 
       AND u.status = 'active'`,
      {
        replacements: { examId: examIds },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    // 3️⃣ Get all users for this grade
    const users = await db.User.findAll({
      include: [
        {
          model: db.UserGrade,
          as: "UserGrades",
          required: true,
          where: { grade_id: grade_id },
          include: [
            {
              model: db.Grade,
              as: "Grade",
              attributes: ["id", "grade_name", "course_id"],
            },
          ],
        },
      ],
      attributes: ["id", "first_name", "last_name"],
    });

    // 4️⃣ Create a result map for easy lookup
    const resultMap = {};
    examResults.forEach(r => {
      if (!resultMap[r.user_id]) resultMap[r.user_id] = {};
      resultMap[r.user_id][r.exam_id] = r.result;
    });

    // 5️⃣ Combine the data
    const resultData = [];
    users.forEach(user => {
      exams.forEach(exam => {
        // Only include if there's an actual result (not '-')
        const actualResult = resultMap[user.id] && resultMap[user.id][exam.id] ? resultMap[user.id][exam.id] : '-';
        if (actualResult && actualResult !== '-' && actualResult.trim() !== '') {
          resultData.push({
            user_id: `${user.id}-${exam.id}`, // Unique ID for each student-exam combination
            user_name: `${user.first_name} ${user.last_name}`,
            results: { [exam.id]: actualResult },
            exam_id: exam.id,
            exam_name: exam.group_name,
            exam_type: exam.exam_type
          });
        }
      });
    });

    res.json({
      students: resultData,
      exams: exams
    });

  } catch (error) {
    console.error("❌ Error fetching results by grade:", error);
    res.status(500).json({ error: error.message });
  }
};


// ===============================
// GET RESULTS WITH USER, GRADE, COURSE
// ===============================
const getResultsByExam = async (req, res) => {
  try {
    const { exam_id } = req.query;

    if (!exam_id) {
      return res.status(400).json({ message: "exam_id is required" });
    }

    // 1️⃣ Get exam_student rows
    const examResults = await db.sequelize.query(
      "SELECT exam_id, user_id, result FROM exam_student WHERE exam_id = ?",
      {
        replacements: [exam_id],
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    if (!examResults.length) {
      return res.json([]);
    }

    // 2️⃣ Get users
    const userIds = examResults.map(r => r.user_id);

    const users = await db.User.findAll({
      where: { id: userIds },
      attributes: ["id", "first_name", "last_name"],
    });

    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u;
    });

    // 3️⃣ Merge data
    const finalResults = examResults.map(r => ({
      exam_id: r.exam_id,
      result: r.result,
      user: userMap[r.user_id] || null,
    }));

    res.json(finalResults);

  } catch (error) {
    console.error("❌ Error fetching results:", error);
    res.status(500).json({ error: error.message });
  }
};


// ===============================
// GET RESULTS BY COURSE
// ===============================
const getResultsByCourse = async (req, res) => {
  try {
    const { course_id } = req.query;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    // 1️⃣ Find all grades for this course
    const grades = await db.Grade.findAll({
      where: { course_id: course_id },
      attributes: ["id"]
    });

    if (!grades.length) {
      return res.json({ students: [], exams: [] });
    }

    const gradeIds = grades.map(grade => grade.id);

    // 2️⃣ Find all exams for these grades
    const exams = await db.Exam.findAll({
      where: { grade_id: gradeIds },
      attributes: ["id", "group_name", "exam_type", "exam_date", "start_time", "end_time", "grade_id"]
    });

    if (!exams.length) {
      return res.json({ students: [], exams: [] });
    }

    const examIds = exams.map(exam => exam.id);

    // 3️⃣ Get all exam_student records for these exams
    const examResults = await db.sequelize.query(
      `SELECT es.exam_id, es.user_id, es.result, u.first_name, u.last_name 
       FROM exam_student es 
       JOIN users u ON es.user_id = u.id 
       WHERE es.exam_id IN (${examIds.map(() => ':examId').join(',')}) 
       AND u.status = 'active'`,
      {
        replacements: { examId: examIds },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    // 4️⃣ Create a result map for easy lookup
    const resultMap = {};
    examResults.forEach(r => {
      if (!resultMap[r.user_id]) resultMap[r.user_id] = {};
      resultMap[r.user_id][r.exam_id] = r.result;
    });

    // 5️⃣ Get all users for these grades
    const users = await db.User.findAll({
      include: [
        {
          model: db.UserGrade,
          as: "UserGrades",
          required: true,
          where: { grade_id: gradeIds },
          include: [
            {
              model: db.Grade,
              as: "Grade",
              attributes: ["id", "grade_name", "course_id"],
            },
          ],
        },
      ],
      attributes: ["id", "first_name", "last_name"],
    });

    // 6️⃣ Combine the data
    const resultData = [];
    users.forEach(user => {
      exams.forEach(exam => {
        // Only include if there's an actual result (not '-')
        const actualResult = resultMap[user.id] && resultMap[user.id][exam.id] ? resultMap[user.id][exam.id] : '-';
        if (actualResult && actualResult !== '-' && actualResult.trim() !== '') {
          resultData.push({
            user_id: `${user.id}-${exam.id}`, // Unique ID for each student-exam combination
            user_name: `${user.first_name} ${user.last_name}`,
            results: { [exam.id]: actualResult },
            exam_id: exam.id,
            exam_name: exam.group_name,
            exam_type: exam.exam_type
          });
        }
      });
    });

    res.json({
      students: resultData,
      exams: exams
    });

  } catch (error) {
    console.error("❌ Error fetching results by course:", error);
    res.status(500).json({ error: error.message });
  }
};


// ===============================
// GET RESULTS BY COURSE AND GRADE
// ===============================
const getResultsByCourseAndGrade = async (req, res) => {
  try {
    const { course_id, grade_id } = req.query;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }
    if (!grade_id) {
      return res.status(400).json({ message: "grade_id is required" });
    }

    // 1️⃣ Find all exams for this grade
    const exams = await db.Exam.findAll({
      where: { grade_id: grade_id },
      attributes: ["id", "group_name", "exam_type", "exam_date", "start_time", "end_time", "grade_id"]
    });

    if (!exams.length) {
      return res.json({ students: [], exams: [] });
    }

    const examIds = exams.map(exam => exam.id);

    // 2️⃣ Get all exam_student records for these exams
    const examResults = await db.sequelize.query(
      `SELECT es.exam_id, es.user_id, es.result, u.first_name, u.last_name 
       FROM exam_student es 
       JOIN users u ON es.user_id = u.id 
       WHERE es.exam_id IN (${examIds.map(() => ':examId').join(',')}) 
       AND u.status = 'active'`,
      {
        replacements: { examId: examIds },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    // 3️⃣ Create a result map for easy lookup
    const resultMap = {};
    examResults.forEach(r => {
      if (!resultMap[r.user_id]) resultMap[r.user_id] = {};
      resultMap[r.user_id][r.exam_id] = r.result;
    });

    // 4️⃣ Get all users for this grade
    const users = await db.User.findAll({
      include: [
        {
          model: db.UserGrade,
          as: "UserGrades",
          required: true,
          where: { grade_id: grade_id },
          include: [
            {
              model: db.Grade,
              as: "Grade",
              attributes: ["id", "grade_name", "course_id"],
            },
          ],
        },
      ],
      attributes: ["id", "first_name", "last_name"],
    });

    // 5️⃣ Combine the data
    const resultData = [];
    users.forEach(user => {
      exams.forEach(exam => {
        // Only include if there's an actual result (not '-')
        const actualResult = resultMap[user.id] && resultMap[user.id][exam.id] ? resultMap[user.id][exam.id] : '-';
        if (actualResult && actualResult !== '-' && actualResult.trim() !== '') {
          resultData.push({
            user_id: `${user.id}-${exam.id}`, // Unique ID for each student-exam combination
            user_name: `${user.first_name} ${user.last_name}`,
            results: { [exam.id]: actualResult },
            exam_id: exam.id,
            exam_name: exam.group_name,
            exam_type: exam.exam_type
          });
        }
      });
    });

    res.json({
      students: resultData,
      exams: exams
    });

  } catch (error) {
    console.error("❌ Error fetching results by course and grade:", error);
    res.status(500).json({ error: error.message });
  }
};


// ===============================
// GET STUDENTS REGISTERED FOR EXAM
// ===============================
const getStudentsForExam = async (req, res) => {
  try {
    const { exam_id } = req.query;

    if (!exam_id) {
      return res.status(400).json({ message: "exam_id is required" });
    }

    // Get exam student mappings for the specific exam
    const examStudents = await db.ExamStudent.findAll({
      where: { exam_id: exam_id },
      include: [
        {
          model: db.User,
          attributes: ["id", "first_name", "last_name"],
          include: [
            {
              model: db.UserGrade,
              as: "UserGrades",
              include: [
                {
                  model: db.Grade,
                  as: "Grade",
                  attributes: ["id", "grade_name", "course_id"],
                },
              ],
            },
          ],
        },
      ],
    });

    // Format the results
    const students = examStudents.map(es => ({
      id: es.User.id,
      first_name: es.User.first_name,
      last_name: es.User.last_name,
      result: es.result,
      grade: es.User.UserGrades[0]?.Grade?.grade_name || null
    }));

    res.json(students);

  } catch (error) {
    console.error("❌ Error fetching students for exam:", error);
    res.status(500).json({ error: error.message });
  }
};


// ✅ VERY IMPORTANT EXPORT
module.exports = {
  getCourses,
  getGradesByCourse,
  getStudentsForResults,
  getStudentsForExam,
  saveResults,
  getAllGrades,
  getResultsByExam,
  getResultsByGrade,  // Add the new function
  getAllResults,      // Add the new function
  getResultsByCourse,       // Add new function
  getResultsByCourseAndGrade, // Add new function
};
