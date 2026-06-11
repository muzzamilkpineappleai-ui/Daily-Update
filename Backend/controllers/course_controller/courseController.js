const db = require('../../models/course_models/index'); 
const { Course, Grade, GradeFee,Branch,UserGrade, sequelize } = db;
const { Op } = require('sequelize');

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await db.Course.findAll({
      include: [{
        model: db.Grade,
        as: 'grade',
        include: [{
          model: db.GradeFee,
          as: 'gradeFees',
          include: [{
            model: db.Branch,
            as: 'branch'
          }]
        }]
      }],
      order: [['created_at', 'DESC']]
    });
    res.status(200).json({ courses });
  } catch (error) {
    console.error('Get Courses Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await db.Course.findByPk(req.params.id, {
      include: [{
        model: db.Grade,
        as: 'grade',
        include: [{
          model: db.GradeFee,
          as: 'gradeFees',
          include: [{
            model: db.Branch,
            as: 'branch'
          }]
        }]
      }],
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.status(200).json(course);
  } catch (error) {
    console.error('Get Course Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};


// CREATE COURSE
exports.createCourse = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { course_code, name, status = 'Active', grades = [] } = req.body;

    // Check if course already exists
    let course = await Course.findOne({
      where: { course_code },
      transaction,
    });

    //Create course only if it doesn't exist
    if (!course) {
      course = await Course.create(
        { course_code, name, status },
        { transaction }
      );
    }

    for (const gradeData of grades) {
      const { grade_name, status: gradeStatus = 'Active', gradeFees = [] } = gradeData;

      const grade = await Grade.create(
        {
          grade_name,
          course_id: course.id,
          status: gradeStatus,
        },
        { transaction }
      );
      
      if (gradeFees.length) {
        const formattedFees = gradeFees.map((fee) => ({
          grade_id: grade.id,
          fee: fee.fee,
          branch_id: fee.branch_id,
        }));

        await GradeFee.bulkCreate(formattedFees, { transaction });
      }
    }

    await transaction.commit();

    const fullCourse = await Course.findByPk(course.id, {
      include: [
        {
          model: Grade,
          as: 'grade',
          include: [
            {
              model: GradeFee,
              as: 'gradeFees',
              include: [{ model: db.Branch, as: 'branch' }],
            },
          ],
        },
      ],
    });

    res.status(201).json(fullCourse);
  } catch (error) {
    await transaction.rollback();
    console.error("Course creation error:", error);
    res.status(500).json({
      error: "Course creation failed",
      detailedError: error.message,
    });
  }
};

exports.updateCourse = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { course_code, name, status, grades = [] } = req.body;

    const course = await Course.findByPk(id, { transaction });
    if (!course) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check for duplicate course_code if provided
    if (course_code && course_code !== course.course_code) {
      const existingCourse = await Course.findOne({ where: { course_code }, transaction });
      if (existingCourse) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Course code already exists' });
      }
    }

    const updateData = {};
    if (course_code) updateData.course_code = course_code;
    if (name) updateData.name = name;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length > 0) {
      await course.update(updateData, { transaction });
    }

    // Handle grade updates
    if (grades && grades.length > 0) {
      for (const gradeData of grades) {
        const { id: gradeId, grade_name, status: gradeStatus, gradeFees = [] } = gradeData;
        if (!gradeId) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Grade ID is required for updates' });
        }

        const grade = await Grade.findByPk(gradeId, { transaction });
        if (!grade || grade.course_id !== course.id) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Invalid grade ID or grade not associated with course' });
        }

        if (grade_name || gradeStatus) {
          await grade.update({
            grade_name: grade_name || grade.grade_name,
            status: gradeStatus || grade.status,
          }, { transaction });
        }

        if (gradeFees.length > 0) {
          for (const feeData of gradeFees) {
            const { id: feeId, fee, branch_id } = feeData;
            if (!branch_id) {
              await transaction.rollback();
              return res.status(400).json({ success: false, message: 'Branch ID is required for grade fees' });
            }

            // Verify branch_id exists
            const branch = await Branch.findByPk(branch_id, { transaction });
            if (!branch) {
              await transaction.rollback();
              return res.status(400).json({ success: false, message: `Invalid branch ID: ${branch_id}` });
            }

            if (feeId) {
              const gradeFee = await GradeFee.findByPk(feeId, { transaction });
              if (gradeFee && gradeFee.grade_id === grade.id) {
                await gradeFee.update(
                  {
                    fee: fee !== undefined ? fee : gradeFee.fee,
                    branch_id: branch_id !== undefined ? branch_id : gradeFee.branch_id,
                  },
                  { transaction }
                );
              } else {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Invalid grade fee ID' });
              }
            } else {
              // Create new GradeFee if no feeId is provided
              await GradeFee.create(
                {
                  grade_id: grade.id,
                  fee: fee || 0,
                  branch_id,
                },
                { transaction }
              );
            }
          }
        }
      }
    }

    await transaction.commit();

    const updatedCourse = await Course.findByPk(course.id, {
      include: {
        model: Grade,
        as: 'grade',
        include: [{
          model: GradeFee,
          as: 'gradeFees',
          include: [{ model: Branch, as: 'branch' }],
        }],
      },
    });

    res.status(200).json({ success: true, message: 'Course and grades updated successfully', data: updatedCourse });
  } catch (error) {
    await transaction.rollback();
    console.error('Update Course Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update course', error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const courseId = req.params.id;

    // 1. Get all grade IDs
    const grades = await Grade.findAll({
      where: { course_id: courseId },
      attributes: ['id'],
      transaction
    });

    const gradeIds = grades.map(g => g.id);

    if (gradeIds.length > 0) {
      // 2. Get all exam IDs
      const exams = await sequelize.query(
        `SELECT id FROM exam WHERE grade_id IN (:gradeIds)`,
        {
          replacements: { gradeIds },
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      const examIds = exams.map(e => e.id);

      // 3. Delete exam_student first (if any exams)
      if (examIds.length > 0) {
        await sequelize.query(
          `DELETE FROM exam_student WHERE exam_id IN (:examIds)`,
          {
            replacements: { examIds },
            type: sequelize.QueryTypes.DELETE,
            transaction
          }
        );
      }

      // 4. Delete exam
      await sequelize.query(
        `DELETE FROM exam WHERE grade_id IN (:gradeIds)`,
        {
          replacements: { gradeIds },
          type: sequelize.QueryTypes.DELETE,
          transaction
        }
      );

      // 5. DELETE ALL CHILD TABLES — ONE BY ONE (Safe!)
      await GradeFee.destroy({
        where: { grade_id: gradeIds },
        transaction,
        // Add this to suppress "no rows affected" warnings
        silent: true
      });

      await sequelize.query(
        `DELETE FROM slot WHERE grade_id IN (:gradeIds)`,
        { replacements: { gradeIds }, type: sequelize.QueryTypes.DELETE, transaction }
      );

      await UserGrade.destroy({
        where: { grade_id: gradeIds },
        transaction,
        silent: true
      });

      // Optional: Add more if needed
      // await OtherTable.destroy({ where: { grade_id: gradeIds }, transaction });
    }

    // 6. Now delete grades
    await Grade.destroy({
      where: { course_id: courseId },
      transaction
    });

    // 7. Finally delete course
    await Course.destroy({
      where: { id: courseId },
      transaction
    });

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Course and all related data deleted successfully'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Delete Course Error:', error);

    const msg = error.message || '';

    if (msg.includes('foreign key constraint') || msg.includes('cannot DELETE')) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete course",
        message: "This course is being used in exams, slots, or student records. All references must be removed first.",
        details: msg
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error during deletion",
      details: msg
    });
  }
};

exports.searchCourses = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Missing search query' });
    }

    const courses = await db.Course.findAll({
      where: {
        [Op.or]: [
          { course_code: { [Op.like]: `%${query}%` } }, // ✅ use `like` for MySQL
          { name: { [Op.like]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: db.Grade,
          as: 'grade',
          include: [
            {
              model: db.GradeFee,
              as: 'gradeFees',
              include: [
                {
                  model: db.Branch,
                  as: 'branch'
                }
              ]
            }
          ]
        }
      ]
    });

    res.status(200).json({ courses });
  } catch (error) {
    console.error('Search Courses Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
