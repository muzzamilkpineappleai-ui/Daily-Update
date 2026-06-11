const express = require("express");
const router = express.Router();
const {getCurrentMonthReport,getStudentPaymentHistory, } = require("../../controllers/report_controller/paymentReportController");

router.get("/current-month", getCurrentMonthReport);
router.get("/student/:student_details_id/history", getStudentPaymentHistory);

module.exports = router;