const express = require('express');
const router = express.Router();
const { createSchedule, getSchedule, deleteSchedule, getScheduleById, updateShedule, searchSchedule, getCourses, getGrades, getDays, getTimeSlots, getLecturers, getBranches} = require('../../controllers/slot_controller/sheduleController');

router.post('/',createSchedule)
router.get('/', getSchedule);
router.get('/search',searchSchedule);
router.get('/:id',getScheduleById);
router.delete('/:id',deleteSchedule);
router.patch('/:id',updateShedule);

router.get('/master/courses', getCourses);
router.get('/master/grades', getGrades);
router.get('/master/days', getDays);
router.get('/master/timeslots', getTimeSlots);
router.get('/master/lecturers', getLecturers);
router.get('/master/branches', getBranches);

module.exports = router;
