const express = require("express");
const router = express.Router();

const resultController = require("../../controllers/result_Controller/resultController");
// GET
router.get("/courses", resultController.getCourses);
router.get("/grades", resultController.getAllGrades);
router.get("/grades/:courseId", resultController.getGradesByCourse);
router.get("/students", resultController.getStudentsForResults);
router.get("/all", resultController.getAllResults); // Add new route for fetching all results
router.get("/by-grade", resultController.getResultsByGrade); // Add new route for fetching results by grade
router.get("/by-course", resultController.getResultsByCourse); // Add new route for fetching results by course
router.get("/by-course-grade", resultController.getResultsByCourseAndGrade); // Add new route for fetching results by course and grade
router.get("/",resultController.getResultsByExam);
router.get("/students-for-exam", resultController.getStudentsForExam); // Get students registered for specific exam



// POST (SAVE RESULTS)
router.post("/", resultController.saveResults);

module.exports = router;
