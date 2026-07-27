const express = require("express");
const meController = require("../controllers/me.controller");
const { requireRoles, requireOwnStudent } = require("../middleware/auth");

const router = express.Router();

router.get("/profile", requireRoles("TEACHER", "STUDENT", "ADMIN"), meController.profile);
router.get("/marks", requireRoles("TEACHER", "STUDENT"), meController.marks);
router.get("/results", requireRoles("STUDENT"), meController.results);
router.get("/attendance", requireRoles("TEACHER", "STUDENT"), meController.attendance);
router.get("/notifications", requireRoles("TEACHER", "STUDENT", "ADMIN"), meController.notifications);
router.patch("/notifications/:id/read", requireRoles("TEACHER", "STUDENT", "ADMIN"), meController.markNotificationRead);
router.get("/marksheet/:examId", requireRoles("STUDENT"), meController.marksheet);
router.get("/assigned-subjects", requireRoles("TEACHER"), meController.assignedSubjects);
router.get("/students", requireRoles("TEACHER"), meController.assignedStudents);
router.get("/attendance-classes", requireRoles("TEACHER"), meController.attendanceClasses);
router.get("/attendance-subjects", requireRoles("TEACHER"), meController.attendanceSubjects);
router.get("/attendance-roster", requireRoles("TEACHER"), meController.attendanceRoster);
router.post("/attendance/bulk", requireRoles("TEACHER"), meController.saveBulkAttendance);

router.get("/students/:studentId/marks", requireOwnStudent("studentId"), meController.privateMarksByStudentId);
router.get("/students/:studentId/results", requireOwnStudent("studentId"), meController.privateResultsByStudentId);
router.get("/students/:studentId/attendance", requireOwnStudent("studentId"), meController.privateAttendanceByStudentId);
router.get("/students/:studentId/marksheet/:examId", requireOwnStudent("studentId"), meController.privateMarksheetByStudentId);

module.exports = router;
