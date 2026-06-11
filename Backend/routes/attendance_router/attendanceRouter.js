const express = require('express');
const router = express.Router();
const { getAttendance, markAttendance, markAbsentStudents, resolveQRCode } = require('../../controllers/attendance_controller/attendanceController');

router.get('/', getAttendance);
router.post('/mark', markAttendance);
router.post('/mark-absent', markAbsentStudents);
router.post('/resolve-qr', resolveQRCode);

module.exports = router;