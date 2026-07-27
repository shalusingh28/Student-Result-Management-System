const pool = require("../config/database");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const ensureStudent = (req, res) => {
  if (!req.user.studentId) {
    errorResponse(res, "Student profile not found for this user", 404);
    return false;
  }
  return true;
};

const ensureTeacher = (req, res) => {
  if (!req.user.teacherId) {
    errorResponse(res, "Teacher profile not found for this user", 404);
    return false;
  }
  return true;
};

const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "Leave"];
const LOW_ATTENDANCE_THRESHOLD = 60;

const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const ensureAssignedAttendanceSubject = async (teacherId, subjectId, academicYearId, semesterId) => {
  const [rows] = await pool.query(
    `SELECT exam_subjects.subject_id, exams.course_id, exams.academic_year_id, exams.semester_id
     FROM exam_subjects
     INNER JOIN exams ON exam_subjects.exam_id = exams.id
     WHERE exam_subjects.teacher_id = ?
      AND exam_subjects.subject_id = ?
      AND exams.academic_year_id = ?
      AND exams.semester_id = ?
     LIMIT 1`,
    [teacherId, subjectId, academicYearId, semesterId]
  );
  return rows[0] || null;
};

const profile = asyncHandler(async (req, res) => {
  if (req.user.role === "STUDENT") {
    if (!ensureStudent(req, res)) return;
    const [rows] = await pool.query(
      `SELECT students.*, courses.name AS course_name, courses.code AS course_code
       FROM students
       LEFT JOIN courses ON students.course_id = courses.id
       WHERE students.id = ?`,
      [req.user.studentId]
    );
    return successResponse(res, "Student profile fetched successfully", rows[0] || null);
  }

  if (req.user.role === "TEACHER") {
    if (!ensureTeacher(req, res)) return;
    const [rows] = await pool.query(
      `SELECT teachers.*, departments.name AS department_name, departments.code AS department_code
       FROM teachers
       LEFT JOIN departments ON teachers.department_id = departments.id
       WHERE teachers.id = ?`,
      [req.user.teacherId]
    );
    return successResponse(res, "Teacher profile fetched successfully", rows[0] || null);
  }

  return successResponse(res, "User profile fetched successfully", req.user);
});

const marks = asyncHandler(async (req, res) => {
  if (req.user.role === "STUDENT") {
    if (!ensureStudent(req, res)) return;
    const [rows] = await pool.query(
      `SELECT marks.*, exams.exam_name, subjects.name AS subject_name
       FROM marks
       LEFT JOIN exams ON marks.exam_id = exams.id
       LEFT JOIN subjects ON marks.subject_id = subjects.id
       WHERE marks.student_id = ?
       ORDER BY exams.id, subjects.id`,
      [req.user.studentId]
    );
    return successResponse(res, "Student marks fetched successfully", rows);
  }

  if (req.user.role === "TEACHER") {
    if (!ensureTeacher(req, res)) return;
    const [rows] = await pool.query(
      `SELECT marks.*, students.name AS student_name, students.roll_no,
        exams.exam_name, subjects.name AS subject_name
       FROM marks
       INNER JOIN exam_subjects ON marks.exam_id = exam_subjects.exam_id
        AND marks.subject_id = exam_subjects.subject_id
       INNER JOIN students ON marks.student_id = students.id
       INNER JOIN exams ON marks.exam_id = exams.id
       INNER JOIN subjects ON marks.subject_id = subjects.id
       WHERE exam_subjects.teacher_id = ?
       ORDER BY students.roll_no, subjects.id`,
      [req.user.teacherId]
    );
    return successResponse(res, "Teacher assigned marks fetched successfully", rows);
  }

  return errorResponse(res, "Only TEACHER or STUDENT can use this endpoint", 403);
});

const results = asyncHandler(async (req, res) => {
  if (!ensureStudent(req, res)) return;
  const [rows] = await pool.query(
    `SELECT results.*, exams.exam_name
     FROM results
     LEFT JOIN exams ON results.exam_id = exams.id
     WHERE results.student_id = ?
      AND results.review_status = 'Published'
      AND results.published_at IS NOT NULL
     ORDER BY results.id DESC`,
    [req.user.studentId]
  );
  return successResponse(res, "Student published results fetched successfully", rows);
});

const attendance = asyncHandler(async (req, res) => {
  if (req.user.role === "STUDENT") {
    if (!ensureStudent(req, res)) return;
    const [rows] = await pool.query(
      `SELECT attendance.*, subjects.name AS subject_name, teachers.name AS teacher_name
       FROM attendance
       LEFT JOIN subjects ON attendance.subject_id = subjects.id
       LEFT JOIN teachers ON attendance.teacher_id = teachers.id
       WHERE attendance.student_id = ?
       ORDER BY attendance.attendance_date DESC`,
      [req.user.studentId]
    );
    return successResponse(res, "Student attendance fetched successfully", rows);
  }

  if (req.user.role === "TEACHER") {
    if (!ensureTeacher(req, res)) return;
    const [rows] = await pool.query(
      `SELECT attendance.*, students.name AS student_name, students.roll_no,
        subjects.name AS subject_name
       FROM attendance
       LEFT JOIN students ON attendance.student_id = students.id
       LEFT JOIN subjects ON attendance.subject_id = subjects.id
       WHERE attendance.teacher_id = ?
       ORDER BY attendance.attendance_date DESC`,
      [req.user.teacherId]
    );
    return successResponse(res, "Teacher attendance fetched successfully", rows);
  }

  return errorResponse(res, "Only TEACHER or STUDENT can use this endpoint", 403);
});

const marksheet = asyncHandler(async (req, res) => {
  if (!ensureStudent(req, res)) return;

  const [resultRows] = await pool.query(
    `SELECT results.*, students.name AS student_name, students.roll_no,
      courses.name AS course_name, departments.name AS department_name,
      semesters.semester_name, exams.exam_name, academic_years.year_name AS academic_year
     FROM results
     LEFT JOIN students ON results.student_id = students.id
     LEFT JOIN courses ON students.course_id = courses.id
     LEFT JOIN departments ON courses.department_id = departments.id
     LEFT JOIN exams ON results.exam_id = exams.id
     LEFT JOIN semesters ON exams.semester_id = semesters.id
     LEFT JOIN academic_years ON exams.academic_year_id = academic_years.id
     WHERE results.student_id = ? AND results.exam_id = ?
      AND results.review_status = 'Published'
      AND results.published_at IS NOT NULL`,
    [req.user.studentId, req.params.examId]
  );

  if (!resultRows.length) {
    return errorResponse(res, "Result is not published yet", 404);
  }

  const [markRows] = await pool.query(
    `SELECT marks.*, subjects.name AS subject_name, subjects.code AS subject_code
     FROM marks
     LEFT JOIN subjects ON marks.subject_id = subjects.id
     WHERE marks.student_id = ? AND marks.exam_id = ?
     ORDER BY subjects.id`,
    [req.user.studentId, req.params.examId]
  );

  return successResponse(res, "Student marksheet fetched successfully", {
    result: resultRows[0] || null,
    marks: markRows,
  });
});

const assignedSubjects = asyncHandler(async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  const [rows] = await pool.query(
    `SELECT exam_subjects.*, exams.exam_name, subjects.name AS subject_name,
      subjects.code AS subject_code
     FROM exam_subjects
     LEFT JOIN exams ON exam_subjects.exam_id = exams.id
     LEFT JOIN subjects ON exam_subjects.subject_id = subjects.id
     WHERE exam_subjects.teacher_id = ?`,
    [req.user.teacherId]
  );
  return successResponse(res, "Teacher assigned subjects fetched successfully", rows);
});

const assignedStudents = asyncHandler(async (req, res) => {
  if (!ensureTeacher(req, res)) return;
  const [rows] = await pool.query(
    `SELECT DISTINCT students.id, students.name, students.roll_no, students.login_username,
      courses.name AS course_name
     FROM students
     INNER JOIN courses ON students.course_id = courses.id
     INNER JOIN subjects ON subjects.course_id = courses.id
     INNER JOIN exam_subjects ON exam_subjects.subject_id = subjects.id
     WHERE exam_subjects.teacher_id = ?
     ORDER BY students.roll_no`,
    [req.user.teacherId]
  );
  return successResponse(res, "Teacher assigned students fetched successfully", rows);
});

const attendanceClasses = asyncHandler(async (req, res) => {
  if (!ensureTeacher(req, res)) return;

  const [rows] = await pool.query(
    `SELECT DISTINCT courses.id AS course_id, courses.name AS course_name, students.class_name
     FROM exam_subjects
     INNER JOIN exams ON exam_subjects.exam_id = exams.id
     INNER JOIN courses ON exams.course_id = courses.id
     INNER JOIN students ON students.course_id = courses.id
     WHERE exam_subjects.teacher_id = ?
     ORDER BY courses.name, students.class_name`,
    [req.user.teacherId]
  );

  return successResponse(res, "Teacher attendance classes fetched successfully", rows);
});

const attendanceSubjects = asyncHandler(async (req, res) => {
  if (!ensureTeacher(req, res)) return;

  const courseId = toNumberOrNull(req.query.courseId || req.query.course_id);
  const className = String(req.query.className || req.query.class_name || "").trim();

  if (!courseId && !className) {
    return errorResponse(res, "courseId or className is required", 400);
  }

  const filters = [req.user.teacherId];
  let where = "WHERE exam_subjects.teacher_id = ?";

  if (courseId) {
    where += " AND exams.course_id = ?";
    filters.push(courseId);
  }

  if (className) {
    where += " AND EXISTS (SELECT 1 FROM students WHERE students.course_id = exams.course_id AND students.class_name = ?)";
    filters.push(className);
  }

  const [rows] = await pool.query(
    `SELECT DISTINCT subjects.id AS subject_id, subjects.name AS subject_name, subjects.code AS subject_code,
      exams.course_id, exams.academic_year_id, academic_years.year_name,
      exams.semester_id, semesters.semester_name
     FROM exam_subjects
     INNER JOIN exams ON exam_subjects.exam_id = exams.id
     INNER JOIN subjects ON exam_subjects.subject_id = subjects.id
     INNER JOIN academic_years ON exams.academic_year_id = academic_years.id
     INNER JOIN semesters ON exams.semester_id = semesters.id
     ${where}
     ORDER BY subjects.name, academic_years.year_name, semesters.semester_name`,
    filters
  );

  return successResponse(res, "Teacher attendance subjects fetched successfully", rows);
});

const attendanceRoster = asyncHandler(async (req, res) => {
  if (!ensureTeacher(req, res)) return;

  const courseId = toNumberOrNull(req.query.courseId || req.query.course_id);
  const subjectId = toNumberOrNull(req.query.subjectId || req.query.subject_id);
  const academicYearId = toNumberOrNull(req.query.academicYearId || req.query.academic_year_id);
  const semesterId = toNumberOrNull(req.query.semesterId || req.query.semester_id);
  const attendanceDate = req.query.date || req.query.attendanceDate || req.query.attendance_date;
  const className = String(req.query.className || req.query.class_name || "").trim();

  if (!courseId || !subjectId || !academicYearId || !semesterId || !attendanceDate) {
    return errorResponse(res, "courseId, subjectId, academicYearId, semesterId, and date are required", 400);
  }

  if (!isValidDate(attendanceDate)) {
    return errorResponse(res, "date must be in YYYY-MM-DD format", 400);
  }

  const assignedSubject = await ensureAssignedAttendanceSubject(req.user.teacherId, subjectId, academicYearId, semesterId);
  if (!assignedSubject || Number(assignedSubject.course_id) !== Number(courseId)) {
    return errorResponse(res, "Subject is not assigned to this teacher for selected class", 403);
  }

  const filters = [subjectId, attendanceDate, subjectId, academicYearId, semesterId, courseId];
  let classFilter = "";
  if (className) {
    classFilter = " AND students.class_name = ?";
    filters.push(className);
  }

  const [rows] = await pool.query(
    `SELECT students.id AS student_id, students.name AS student_name, students.roll_no, students.class_name,
      courses.name AS course_name,
      COALESCE(today.status, 'Present') AS status,
      COALESCE(today.remarks, '') AS remarks,
      COALESCE(summary.present_classes, 0) AS present_classes,
      COALESCE(summary.total_classes, 0) AS total_classes,
      CASE
        WHEN COALESCE(summary.total_classes, 0) = 0 THEN 0
        ELSE ROUND((summary.present_classes / summary.total_classes) * 100, 2)
      END AS attendance_percentage,
      CASE
        WHEN COALESCE(summary.total_classes, 0) > 0
          AND ROUND((summary.present_classes / summary.total_classes) * 100, 2) < ?
        THEN TRUE ELSE FALSE
      END AS is_low_attendance
     FROM students
     INNER JOIN courses ON students.course_id = courses.id
     LEFT JOIN attendance today ON today.student_id = students.id
      AND today.subject_id = ?
      AND today.attendance_date = ?
     LEFT JOIN (
      SELECT student_id,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_classes,
        COUNT(*) AS total_classes
      FROM attendance
      WHERE subject_id = ? AND academic_year_id = ? AND semester_id = ?
      GROUP BY student_id
     ) summary ON summary.student_id = students.id
     WHERE students.course_id = ?${classFilter}
     ORDER BY students.roll_no`,
    [LOW_ATTENDANCE_THRESHOLD, ...filters]
  );

  return successResponse(res, "Teacher attendance roster fetched successfully", rows);
});

const saveBulkAttendance = asyncHandler(async (req, res) => {
  if (!ensureTeacher(req, res)) return;

  const subjectId = toNumberOrNull(req.body.subjectId || req.body.subject_id);
  const academicYearId = toNumberOrNull(req.body.academicYearId || req.body.academic_year_id);
  const semesterId = toNumberOrNull(req.body.semesterId || req.body.semester_id);
  const attendanceDate = req.body.attendanceDate || req.body.attendance_date;
  const records = Array.isArray(req.body.records) ? req.body.records : [];

  if (!subjectId || !academicYearId || !semesterId || !attendanceDate || !records.length) {
    return errorResponse(res, "subjectId, academicYearId, semesterId, attendanceDate, and records are required", 400);
  }

  if (!isValidDate(attendanceDate)) {
    return errorResponse(res, "attendanceDate must be in YYYY-MM-DD format", 400);
  }

  const assignedSubject = await ensureAssignedAttendanceSubject(req.user.teacherId, subjectId, academicYearId, semesterId);
  if (!assignedSubject) {
    return errorResponse(res, "Subject is not assigned to this teacher", 403);
  }

  const values = [];
  for (const record of records) {
    const studentId = toNumberOrNull(record.studentId || record.student_id);
    const status = record.status;
    if (!studentId || !ATTENDANCE_STATUSES.includes(status)) {
      return errorResponse(res, "Each record must have a valid studentId and status", 400);
    }
    values.push([studentId, subjectId, req.user.teacherId, academicYearId, semesterId, attendanceDate, status, record.remarks || null]);
  }

  const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  await pool.query(
    `INSERT INTO attendance (student_id, subject_id, teacher_id, academic_year_id, semester_id, attendance_date, status, remarks)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
      teacher_id = VALUES(teacher_id),
      academic_year_id = VALUES(academic_year_id),
      semester_id = VALUES(semester_id),
      status = VALUES(status),
      remarks = VALUES(remarks)`,
    values.flat()
  );

  return successResponse(res, "Attendance saved successfully", { saved: records.length });
});

const privateMarksByStudentId = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT marks.*, exams.exam_name, subjects.name AS subject_name
     FROM marks
     LEFT JOIN exams ON marks.exam_id = exams.id
     LEFT JOIN subjects ON marks.subject_id = subjects.id
     WHERE marks.student_id = ?
     ORDER BY exams.id, subjects.id`,
    [req.params.studentId]
  );
  return successResponse(res, "Private student marks fetched successfully", rows);
});

const privateResultsByStudentId = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT results.*, exams.exam_name
     FROM results
     LEFT JOIN exams ON results.exam_id = exams.id
     WHERE results.student_id = ?
      AND results.review_status = 'Published'
      AND results.published_at IS NOT NULL
     ORDER BY results.id DESC`,
    [req.params.studentId]
  );
  return successResponse(res, "Private student published results fetched successfully", rows);
});

const privateAttendanceByStudentId = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT attendance.*, subjects.name AS subject_name, teachers.name AS teacher_name
     FROM attendance
     LEFT JOIN subjects ON attendance.subject_id = subjects.id
     LEFT JOIN teachers ON attendance.teacher_id = teachers.id
     WHERE attendance.student_id = ?
     ORDER BY attendance.attendance_date DESC`,
    [req.params.studentId]
  );
  return successResponse(res, "Private student attendance fetched successfully", rows);
});

const notifications = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [req.user.id]
  );
  return successResponse(res, "Notifications fetched successfully", rows);
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id]
  );

  if (result.affectedRows === 0) {
    return errorResponse(res, "Notification not found", 404);
  }

  return successResponse(res, "Notification marked as read successfully");
});

const privateMarksheetByStudentId = asyncHandler(async (req, res) => {
  const [resultRows] = await pool.query(
    `SELECT results.*, students.name AS student_name, students.roll_no,
      courses.name AS course_name, departments.name AS department_name,
      semesters.semester_name, exams.exam_name, academic_years.year_name AS academic_year
     FROM results
     LEFT JOIN students ON results.student_id = students.id
     LEFT JOIN courses ON students.course_id = courses.id
     LEFT JOIN departments ON courses.department_id = departments.id
     LEFT JOIN exams ON results.exam_id = exams.id
     LEFT JOIN semesters ON exams.semester_id = semesters.id
     LEFT JOIN academic_years ON exams.academic_year_id = academic_years.id
     WHERE results.student_id = ? AND results.exam_id = ?
      AND results.review_status = 'Published'
      AND results.published_at IS NOT NULL`,
    [req.params.studentId, req.params.examId]
  );

  if (!resultRows.length) {
    return errorResponse(res, "Result is not published yet", 404);
  }

  const [markRows] = await pool.query(
    `SELECT marks.*, subjects.name AS subject_name, subjects.code AS subject_code
     FROM marks
     LEFT JOIN subjects ON marks.subject_id = subjects.id
     WHERE marks.student_id = ? AND marks.exam_id = ?
     ORDER BY subjects.id`,
    [req.params.studentId, req.params.examId]
  );

  return successResponse(res, "Private student marksheet fetched successfully", {
    result: resultRows[0] || null,
    marks: markRows,
  });
});

module.exports = {
  profile,
  marks,
  results,
  attendance,
  marksheet,
  assignedSubjects,
  assignedStudents,
  attendanceClasses,
  attendanceSubjects,
  attendanceRoster,
  saveBulkAttendance,
  notifications,
  markNotificationRead,
  privateMarksByStudentId,
  privateResultsByStudentId,
  privateAttendanceByStudentId,
  privateMarksheetByStudentId,
};
