const express = require("express");
const router = express.Router();
const examController = require("../../controllers/exam_controller/examController");

router.get("/", examController.getAllExams);
router.get("/students", examController.getStudentsByCourseAndGrade);
router.get("/:examId/students", examController.getSelectedStudents);
router.get('/courses', examController.getAllCourses);
router.get('/:id', examController.getExamById);
router.get('/grades/course/:courseId', examController.getGradesByCourse);
router.get('/exams/course-grade', examController.getExamsByCourseAndGrade);
router.post("/", examController.createExam);
router.patch("/:id", examController.updateExam);
router.delete("/:id", examController.deleteExam);

module.exports = router;
