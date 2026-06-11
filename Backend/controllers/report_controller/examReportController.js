const db = require("../../models/examReportModels");        
const { Exam, Grade } = db;              

exports.getExamDetails = async (req, res) => {
  try {
    if (!Exam || typeof Exam.findAll !== "function") {
      return res.status(500).json({
        success: false,
        message: "Server error: Database models not loaded properly",
      });
    }

    const exams = await Exam.findAll({
      include: [
        {
          model: Grade,
          as: "grade",
          attributes: ["grade_name"],
          required: true, // Use inner join (only exams with grade)
        },
      ],
      attributes: ["id", "group_name", "exam_date", "start_time", "end_time"],
      raw: true,
      nest: true, // This creates exam.Grade.grade_name
      order: [["exam_date", "ASC"], ["start_time", "ASC"]],
    });

    // Format the response properly
    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      group_name: exam.group_name,
      exam_date: exam.exam_date,
      start_time: exam.start_time ? exam.start_time.slice(0, 5) : null,
      end_time: exam.end_time ? exam.end_time.slice(0, 5) : null,
      grade_name: exam.grade?.grade_name || "Unknown Grade",
    }));

    return res.status(200).json({
      success: true,
      count: formattedExams.length,
      data: formattedExams,
    });

  } catch (error) {
    console.error("Error fetching exam details:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};