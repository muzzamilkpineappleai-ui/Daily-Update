const express = require('express');
const router = express.Router();
const CourseController = require('../../controllers/user_controller/courseController');

router.get('/', CourseController.listCourses);
router.get('/course/:courseId/grades', CourseController.getCourseGrades);
router.post('/:studentId/grade', CourseController.assignGrade);
router.get('/student/:studentId/grades', CourseController.getStudentGrades);



module.exports = router;