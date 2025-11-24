const { Exam, Grade } = require("../../models/models");

exports.getExamDetails = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      include: [
        {
          model: Grade,
          attributes: ["grade_name"],
        },
      ],
      attributes: ["id", "group_name", "exam_date", "start_time", "end_time"],
      raw: true,
      nest: true, // Makes nested Grade object available as Grade.grade_name
    });

    // 🕐 Format time (remove :00)
    const formattedExams = exams.map((exam) => ({
      ...exam,
      start_time: exam.start_time ? exam.start_time.slice(0, 5) : null,
      end_time: exam.end_time ? exam.end_time.slice(0, 5) : null,
    }));

    res.json({
      success: true,
      data: formattedExams,
    });
  } catch (error) {
    console.error("❌ Error fetching exam details:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching exam details",
    });
  }
};
