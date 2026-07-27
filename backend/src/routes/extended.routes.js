const express = require("express");
const createCrudModel = require("../models/base.model");
const createCrudController = require("../controllers/base.controller");
const createCrudRouter = require("./crud.routes");
const { requireRoles } = require("../middleware/auth");

const router = express.Router();

const resources = [
  {
    path: "/permissions",
    name: "Permission",
    table: "permissions",
    fields: ["name", "module", "action", "description"],
    filters: { module: "permissions.module", action: "permissions.action" },
  },
  {
    path: "/teachers",
    name: "Teacher",
    table: "teachers",
    fields: ["user_id", "department_id", "employee_code", "name", "email", "phone", "qualification", "designation", "joining_date", "status"],
    select: "teachers.*, users.username AS user_username, departments.name AS department_name, departments.code AS department_code",
    joins: "LEFT JOIN users ON teachers.user_id = users.id LEFT JOIN departments ON teachers.department_id = departments.id",
    filters: {
      userId: "teachers.user_id",
      user_id: "teachers.user_id",
      departmentId: "teachers.department_id",
      department_id: "teachers.department_id",
      status: "teachers.status",
    },
  },
  {
    path: "/enrollments",
    name: "Enrollment",
    table: "enrollments",
    fields: ["student_id", "course_id", "academic_year_id", "semester_id", "enrollment_no", "enrollment_date", "status"],
    select: "enrollments.*, students.name AS student_name, students.roll_no, courses.name AS course_name, courses.code AS course_code, academic_years.year_name, semesters.semester_name",
    joins: "LEFT JOIN students ON enrollments.student_id = students.id LEFT JOIN courses ON enrollments.course_id = courses.id LEFT JOIN academic_years ON enrollments.academic_year_id = academic_years.id LEFT JOIN semesters ON enrollments.semester_id = semesters.id",
    filters: {
      studentId: "enrollments.student_id",
      student_id: "enrollments.student_id",
      courseId: "enrollments.course_id",
      course_id: "enrollments.course_id",
      academicYearId: "enrollments.academic_year_id",
      academic_year_id: "enrollments.academic_year_id",
      semesterId: "enrollments.semester_id",
      semester_id: "enrollments.semester_id",
      status: "enrollments.status",
    },
  },
  {
    path: "/exam-subjects",
    name: "Exam Subject",
    table: "exam_subjects",
    fields: ["exam_id", "subject_id", "teacher_id", "exam_date", "start_time", "end_time", "max_marks", "passing_marks"],
    select: "exam_subjects.*, exams.exam_name, subjects.name AS subject_name, subjects.code AS subject_code, teachers.name AS teacher_name, teachers.employee_code",
    joins: "LEFT JOIN exams ON exam_subjects.exam_id = exams.id LEFT JOIN subjects ON exam_subjects.subject_id = subjects.id LEFT JOIN teachers ON exam_subjects.teacher_id = teachers.id",
    filters: {
      examId: "exam_subjects.exam_id",
      exam_id: "exam_subjects.exam_id",
      subjectId: "exam_subjects.subject_id",
      subject_id: "exam_subjects.subject_id",
      teacherId: "exam_subjects.teacher_id",
      teacher_id: "exam_subjects.teacher_id",
    },
  },
  {
    path: "/attendance",
    name: "Attendance",
    table: "attendance",
    fields: ["student_id", "subject_id", "teacher_id", "academic_year_id", "semester_id", "attendance_date", "status", "remarks"],
    select: "attendance.*, students.name AS student_name, students.roll_no, subjects.name AS subject_name, teachers.name AS teacher_name, academic_years.year_name, semesters.semester_name",
    joins: "LEFT JOIN students ON attendance.student_id = students.id LEFT JOIN subjects ON attendance.subject_id = subjects.id LEFT JOIN teachers ON attendance.teacher_id = teachers.id LEFT JOIN academic_years ON attendance.academic_year_id = academic_years.id LEFT JOIN semesters ON attendance.semester_id = semesters.id",
    filters: {
      studentId: "attendance.student_id",
      student_id: "attendance.student_id",
      subjectId: "attendance.subject_id",
      subject_id: "attendance.subject_id",
      teacherId: "attendance.teacher_id",
      teacher_id: "attendance.teacher_id",
      academicYearId: "attendance.academic_year_id",
      academic_year_id: "attendance.academic_year_id",
      semesterId: "attendance.semester_id",
      semester_id: "attendance.semester_id",
      attendanceDate: "attendance.attendance_date",
      attendance_date: "attendance.attendance_date",
      status: "attendance.status",
    },
  },
  {
    path: "/notices",
    name: "Notice",
    table: "notices",
    fields: ["title", "message", "target_audience", "department_id", "course_id", "published_by", "publish_date", "expiry_date", "status"],
    select: "notices.*, departments.name AS department_name, courses.name AS course_name, users.name AS publisher_name",
    joins: "LEFT JOIN departments ON notices.department_id = departments.id LEFT JOIN courses ON notices.course_id = courses.id LEFT JOIN users ON notices.published_by = users.id",
    filters: {
      targetAudience: "notices.target_audience",
      target_audience: "notices.target_audience",
      departmentId: "notices.department_id",
      department_id: "notices.department_id",
      courseId: "notices.course_id",
      course_id: "notices.course_id",
      status: "notices.status",
    },
  },
  {
    path: "/notifications",
    name: "Notification",
    table: "notifications",
    fields: ["user_id", "title", "message", "type", "is_read", "read_at"],
    select: "notifications.*, users.name AS user_name, users.username, users.email",
    joins: "LEFT JOIN users ON notifications.user_id = users.id",
    filters: {
      userId: "notifications.user_id",
      user_id: "notifications.user_id",
      type: "notifications.type",
      isRead: "notifications.is_read",
      is_read: "notifications.is_read",
    },
  },
  {
    path: "/documents",
    name: "Document",
    table: "documents",
    fields: ["student_id", "teacher_id", "uploaded_by", "title", "document_type", "file_name", "file_path", "mime_type", "file_size", "status"],
    select: "documents.*, students.name AS student_name, students.roll_no, teachers.name AS teacher_name, users.name AS uploader_name",
    joins: "LEFT JOIN students ON documents.student_id = students.id LEFT JOIN teachers ON documents.teacher_id = teachers.id LEFT JOIN users ON documents.uploaded_by = users.id",
    filters: {
      studentId: "documents.student_id",
      student_id: "documents.student_id",
      teacherId: "documents.teacher_id",
      teacher_id: "documents.teacher_id",
      uploadedBy: "documents.uploaded_by",
      uploaded_by: "documents.uploaded_by",
      documentType: "documents.document_type",
      document_type: "documents.document_type",
      status: "documents.status",
    },
  },
  {
    path: "/audit-logs",
    name: "Audit Log",
    table: "audit_logs",
    fields: ["user_id", "action", "entity_name", "entity_id", "old_values", "new_values", "ip_address", "user_agent"],
    select: "audit_logs.*, users.name AS user_name, users.username",
    joins: "LEFT JOIN users ON audit_logs.user_id = users.id",
    filters: {
      userId: "audit_logs.user_id",
      user_id: "audit_logs.user_id",
      action: "audit_logs.action",
      entityName: "audit_logs.entity_name",
      entity_name: "audit_logs.entity_name",
      entityId: "audit_logs.entity_id",
      entity_id: "audit_logs.entity_id",
    },
  },
];

resources.forEach((resource) => {
  const model = createCrudModel(resource);
  const controller = createCrudController(model, resource.name);
  const superAdminOnly = ["/permissions", "/audit-logs"];
  const allowedRoles = superAdminOnly.includes(resource.path) ? ["SUPER_ADMIN"] : ["ADMIN"];
  router.use(resource.path, requireRoles(...allowedRoles), createCrudRouter(controller));
});

module.exports = router;
