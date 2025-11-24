const express = require("express");
const router = express.Router();
const { getExamDetails } = require("../../controllers/exam_controller/examController");

router.get("/", getExamDetails);

module.exports = router;
