const express = require("express");
const router = express.Router();
const { getExamDetails } = require("../../controllers/report_controller/examReportController");

router.get("/", getExamDetails);

module.exports = router;
