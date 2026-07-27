const express = require("express");
const reportController = require("../controllers/report.controller");

const router = express.Router();

router.get("/student-results", reportController.studentResults);
router.get("/semester", reportController.semesterReport);
router.get("/course-performance", reportController.coursePerformance);
router.get("/subject-performance", reportController.subjectPerformance);
router.get("/pass-fail", reportController.passFailReport);
router.get("/toppers", reportController.toppers);
router.get("/attendance", reportController.attendanceReport);

module.exports = router;
