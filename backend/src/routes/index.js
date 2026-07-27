const express = require("express");

const authRoutes = require("./auth.routes");
const meRoutes = require("./me.routes");
const roleRoutes = require("./role.routes");
const userRoutes = require("./user.routes");
const departmentRoutes = require("./department.routes");
const courseRoutes = require("./course.routes");
const subjectRoutes = require("./subject.routes");
const academicYearRoutes = require("./academicYear.routes");
const semesterRoutes = require("./semester.routes");
const studentRoutes = require("./student.routes");
const examRoutes = require("./exam.routes");
const markRoutes = require("./mark.routes");
const resultRoutes = require("./result.routes");
const reportRoutes = require("./report.routes");
const extendedRoutes = require("./extended.routes");
const { authenticate, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.use("/auth", authRoutes);

router.use(authenticate);

router.use("/me", meRoutes);
router.use("/roles", requireRoles("SUPER_ADMIN"), roleRoutes);
router.use("/users", requireRoles("SUPER_ADMIN", "ADMIN"), userRoutes);
router.use("/departments", requireRoles("SUPER_ADMIN", "ADMIN"), departmentRoutes);
router.use("/courses", requireRoles("SUPER_ADMIN", "ADMIN"), courseRoutes);
router.use("/subjects", requireRoles("SUPER_ADMIN", "ADMIN"), subjectRoutes);
router.use("/academic-years", requireRoles("SUPER_ADMIN", "ADMIN"), academicYearRoutes);
router.use("/semesters", requireRoles("SUPER_ADMIN", "ADMIN"), semesterRoutes);
router.use("/students", requireRoles("SUPER_ADMIN", "ADMIN"), studentRoutes);
router.use("/exams", requireRoles("SUPER_ADMIN", "ADMIN"), examRoutes);
router.use("/marks", requireRoles("SUPER_ADMIN", "ADMIN", "TEACHER"), markRoutes);
router.use("/results", requireRoles("SUPER_ADMIN", "ADMIN"), resultRoutes);
router.use("/reports", requireRoles("SUPER_ADMIN", "ADMIN"), reportRoutes);
router.use("/", extendedRoutes);

module.exports = router;
