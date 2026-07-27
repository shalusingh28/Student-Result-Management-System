const pool = require("../config/database");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

const LOW_ATTENDANCE_THRESHOLD = 60;

const getParam = (query, camelKey, snakeKey) => query[camelKey] || query[snakeKey];
const toNumber = (value, fallback = null) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

const buildResultFilters = (query, tableAlias = "results") => {
  const filters = [];
  const values = [];
  const reviewStatus = getParam(query, "reviewStatus", "review_status") || "Published";
  const mappings = [
    ["studentId", "student_id", `${tableAlias}.student_id`],
    ["courseId", "course_id", "students.course_id"],
    ["examId", "exam_id", `${tableAlias}.exam_id`],
    ["semesterId", "semester_id", "exams.semester_id"],
    ["academicYearId", "academic_year_id", "exams.academic_year_id"],
    ["finalResult", "final_result", `${tableAlias}.final_result`],
  ];

  if (reviewStatus !== "all") {
    filters.push(`${tableAlias}.review_status = ?`);
    values.push(reviewStatus);
  }

  mappings.forEach(([camelKey, snakeKey, column]) => {
    const value = getParam(query, camelKey, snakeKey);
    if (value) {
      filters.push(`${column} = ?`);
      values.push(value);
    }
  });

  if (query.fromDate) {
    filters.push(`${tableAlias}.created_at >= ?`);
    values.push(query.fromDate);
  }

  if (query.toDate) {
    filters.push(`${tableAlias}.created_at <= ?`);
    values.push(query.toDate);
  }

  return {
    clause: filters.length ? `WHERE ${filters.join(" AND ")}` : "",
    values,
  };
};

const studentResults = asyncHandler(async (req, res) => {
  const { clause, values } = buildResultFilters(req.query);
  const [rows] = await pool.query(
    `SELECT results.id, results.student_id, students.name AS student_name, students.roll_no,
      students.class_name, courses.name AS course_name, courses.code AS course_code,
      exams.id AS exam_id, exams.exam_name, semesters.semester_name,
      academic_years.year_name AS academic_year, results.total_marks, results.maximum_marks,
      results.percentage, results.gpa, results.cgpa, results.overall_grade,
      results.final_result, results.review_status, results.published_at
     FROM results
     INNER JOIN students ON results.student_id = students.id
     INNER JOIN courses ON students.course_id = courses.id
     INNER JOIN exams ON results.exam_id = exams.id
     INNER JOIN semesters ON exams.semester_id = semesters.id
     INNER JOIN academic_years ON exams.academic_year_id = academic_years.id
     ${clause}
     ORDER BY students.roll_no, exams.exam_name`,
    values
  );
  return successResponse(res, "Student result report fetched successfully", rows);
});

const semesterReport = asyncHandler(async (req, res) => {
  const { clause, values } = buildResultFilters(req.query);
  const [rows] = await pool.query(
    `SELECT academic_years.year_name AS academic_year, semesters.semester_name,
      courses.name AS course_name, COUNT(results.id) AS total_results,
      SUM(CASE WHEN results.final_result = 'Pass' THEN 1 ELSE 0 END) AS pass_count,
      SUM(CASE WHEN results.final_result = 'Fail' THEN 1 ELSE 0 END) AS fail_count,
      ROUND((SUM(CASE WHEN results.final_result = 'Pass' THEN 1 ELSE 0 END) / COUNT(results.id)) * 100, 2) AS pass_percentage,
      ROUND((SUM(CASE WHEN results.final_result = 'Fail' THEN 1 ELSE 0 END) / COUNT(results.id)) * 100, 2) AS fail_percentage,
      ROUND(AVG(results.percentage), 2) AS average_percentage,
      MAX(results.percentage) AS highest_percentage,
      MIN(results.percentage) AS lowest_percentage
     FROM results
     INNER JOIN students ON results.student_id = students.id
     INNER JOIN courses ON students.course_id = courses.id
     INNER JOIN exams ON results.exam_id = exams.id
     INNER JOIN semesters ON exams.semester_id = semesters.id
     INNER JOIN academic_years ON exams.academic_year_id = academic_years.id
     ${clause}
     GROUP BY academic_years.id, semesters.id, courses.id
     ORDER BY academic_years.year_name, semesters.semester_name, courses.name`,
    values
  );
  return successResponse(res, "Semester report fetched successfully", rows);
});

const coursePerformance = asyncHandler(async (req, res) => {
  const { clause, values } = buildResultFilters(req.query);
  const [rows] = await pool.query(
    `SELECT courses.id AS course_id, courses.name AS course_name, courses.code AS course_code,
      COUNT(DISTINCT students.id) AS total_students, COUNT(results.id) AS total_results,
      ROUND(AVG(results.percentage), 2) AS average_percentage,
      SUM(CASE WHEN results.final_result = 'Pass' THEN 1 ELSE 0 END) AS pass_count,
      SUM(CASE WHEN results.final_result = 'Fail' THEN 1 ELSE 0 END) AS fail_count,
      ROUND((SUM(CASE WHEN results.final_result = 'Pass' THEN 1 ELSE 0 END) / COUNT(results.id)) * 100, 2) AS pass_percentage,
      (SELECT s2.name
       FROM results r2
       INNER JOIN students s2 ON r2.student_id = s2.id
       WHERE s2.course_id = courses.id
       ORDER BY r2.percentage DESC
       LIMIT 1) AS topper_name,
      (SELECT r2.percentage
       FROM results r2
       INNER JOIN students s2 ON r2.student_id = s2.id
       WHERE s2.course_id = courses.id
       ORDER BY r2.percentage DESC
       LIMIT 1) AS topper_percentage
     FROM results
     INNER JOIN students ON results.student_id = students.id
     INNER JOIN courses ON students.course_id = courses.id
     INNER JOIN exams ON results.exam_id = exams.id
     ${clause}
     GROUP BY courses.id
     ORDER BY average_percentage DESC`,
    values
  );
  return successResponse(res, "Course performance report fetched successfully", rows);
});

const subjectPerformance = asyncHandler(async (req, res) => {
  const filters = [];
  const values = [];
  const subjectId = getParam(req.query, "subjectId", "subject_id");
  const courseId = getParam(req.query, "courseId", "course_id");
  const examId = getParam(req.query, "examId", "exam_id");
  const semesterId = getParam(req.query, "semesterId", "semester_id");
  const academicYearId = getParam(req.query, "academicYearId", "academic_year_id");

  if (subjectId) {
    filters.push("marks.subject_id = ?");
    values.push(subjectId);
  }
  if (courseId) {
    filters.push("students.course_id = ?");
    values.push(courseId);
  }
  if (examId) {
    filters.push("marks.exam_id = ?");
    values.push(examId);
  }
  if (semesterId) {
    filters.push("exams.semester_id = ?");
    values.push(semesterId);
  }
  if (academicYearId) {
    filters.push("exams.academic_year_id = ?");
    values.push(academicYearId);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT subjects.id AS subject_id, subjects.name AS subject_name, subjects.code AS subject_code,
      courses.name AS course_name, exams.exam_name,
      COUNT(marks.id) AS total_students,
      ROUND(AVG(marks.total_marks), 2) AS average_marks,
      MAX(exam_subjects.max_marks) AS max_marks,
      MAX(exam_subjects.passing_marks) AS passing_marks,
      SUM(CASE WHEN marks.total_marks >= exam_subjects.passing_marks THEN 1 ELSE 0 END) AS pass_count,
      SUM(CASE WHEN marks.total_marks < exam_subjects.passing_marks THEN 1 ELSE 0 END) AS fail_count,
      ROUND((SUM(CASE WHEN marks.total_marks >= exam_subjects.passing_marks THEN 1 ELSE 0 END) / COUNT(marks.id)) * 100, 2) AS pass_percentage,
      ROUND((AVG(marks.total_marks) / MAX(exam_subjects.max_marks)) * 100, 2) AS average_subject_percentage
     FROM marks
     INNER JOIN subjects ON marks.subject_id = subjects.id
     INNER JOIN students ON marks.student_id = students.id
     INNER JOIN courses ON students.course_id = courses.id
     INNER JOIN exams ON marks.exam_id = exams.id
     LEFT JOIN exam_subjects ON marks.exam_id = exam_subjects.exam_id AND marks.subject_id = exam_subjects.subject_id
     ${whereClause}
     GROUP BY subjects.id, courses.id, exams.id
     ORDER BY average_subject_percentage DESC`,
    values
  );
  return successResponse(res, "Subject performance report fetched successfully", rows);
});

const passFailReport = asyncHandler(async (req, res) => {
  const { clause, values } = buildResultFilters(req.query);
  const [summaryRows] = await pool.query(
    `SELECT COUNT(results.id) AS total_results,
      SUM(CASE WHEN results.final_result = 'Pass' THEN 1 ELSE 0 END) AS pass_count,
      SUM(CASE WHEN results.final_result = 'Fail' THEN 1 ELSE 0 END) AS fail_count,
      ROUND((SUM(CASE WHEN results.final_result = 'Pass' THEN 1 ELSE 0 END) / COUNT(results.id)) * 100, 2) AS pass_percentage,
      ROUND((SUM(CASE WHEN results.final_result = 'Fail' THEN 1 ELSE 0 END) / COUNT(results.id)) * 100, 2) AS fail_percentage
     FROM results
     INNER JOIN students ON results.student_id = students.id
     INNER JOIN exams ON results.exam_id = exams.id
     ${clause}`,
    values
  );

  const groupedQuery = (labelSql, groupSql, orderSql) => pool.query(
    `SELECT ${labelSql}, COUNT(results.id) AS total_results,
      SUM(CASE WHEN results.final_result = 'Pass' THEN 1 ELSE 0 END) AS pass_count,
      SUM(CASE WHEN results.final_result = 'Fail' THEN 1 ELSE 0 END) AS fail_count,
      ROUND((SUM(CASE WHEN results.final_result = 'Pass' THEN 1 ELSE 0 END) / COUNT(results.id)) * 100, 2) AS pass_percentage,
      ROUND((SUM(CASE WHEN results.final_result = 'Fail' THEN 1 ELSE 0 END) / COUNT(results.id)) * 100, 2) AS fail_percentage
     FROM results
     INNER JOIN students ON results.student_id = students.id
     INNER JOIN courses ON students.course_id = courses.id
     INNER JOIN exams ON results.exam_id = exams.id
     INNER JOIN semesters ON exams.semester_id = semesters.id
     ${clause}
     GROUP BY ${groupSql}
     ORDER BY ${orderSql}`,
    values
  );

  const [[byCourse], [bySemester], [byExam]] = await Promise.all([
    groupedQuery("courses.name AS label", "courses.id", "courses.name"),
    groupedQuery("semesters.semester_name AS label", "semesters.id", "semesters.semester_name"),
    groupedQuery("exams.exam_name AS label", "exams.id", "exams.exam_name"),
  ]);

  return successResponse(res, "Pass/fail report fetched successfully", {
    summary: summaryRows[0] || {},
    byCourse,
    bySemester,
    byExam,
  });
});

const toppers = asyncHandler(async (req, res) => {
  const limit = Math.min(toNumber(req.query.limit, 10), 100);
  const { clause, values } = buildResultFilters(req.query);
  const [rows] = await pool.query(
    `SELECT results.student_id, students.name AS student_name, students.roll_no,
      courses.name AS course_name, exams.exam_name, semesters.semester_name,
      results.percentage, results.total_marks, results.maximum_marks, results.overall_grade
     FROM results
     INNER JOIN students ON results.student_id = students.id
     INNER JOIN courses ON students.course_id = courses.id
     INNER JOIN exams ON results.exam_id = exams.id
     INNER JOIN semesters ON exams.semester_id = semesters.id
     ${clause}
     ORDER BY results.percentage DESC, results.total_marks DESC
     LIMIT ?`,
    [...values, limit]
  );
  return successResponse(res, "Topper report fetched successfully", rows.map((row, index) => ({ rank: index + 1, ...row })));
});

const attendanceReport = asyncHandler(async (req, res) => {
  const filters = [];
  const values = [];
  const courseId = getParam(req.query, "courseId", "course_id");
  const subjectId = getParam(req.query, "subjectId", "subject_id");
  const semesterId = getParam(req.query, "semesterId", "semester_id");
  const academicYearId = getParam(req.query, "academicYearId", "academic_year_id");

  if (courseId) {
    filters.push("students.course_id = ?");
    values.push(courseId);
  }
  if (subjectId) {
    filters.push("attendance.subject_id = ?");
    values.push(subjectId);
  }
  if (semesterId) {
    filters.push("attendance.semester_id = ?");
    values.push(semesterId);
  }
  if (academicYearId) {
    filters.push("attendance.academic_year_id = ?");
    values.push(academicYearId);
  }
  if (req.query.fromDate) {
    filters.push("attendance.attendance_date >= ?");
    values.push(req.query.fromDate);
  }
  if (req.query.toDate) {
    filters.push("attendance.attendance_date <= ?");
    values.push(req.query.toDate);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT students.id AS student_id, students.name AS student_name, students.roll_no,
      courses.name AS course_name, subjects.name AS subject_name, semesters.semester_name,
      academic_years.year_name AS academic_year,
      SUM(CASE WHEN attendance.status = 'Present' THEN 1 ELSE 0 END) AS present_classes,
      SUM(CASE WHEN attendance.status = 'Absent' THEN 1 ELSE 0 END) AS absent_classes,
      SUM(CASE WHEN attendance.status = 'Late' THEN 1 ELSE 0 END) AS late_classes,
      SUM(CASE WHEN attendance.status = 'Leave' THEN 1 ELSE 0 END) AS leave_classes,
      COUNT(attendance.id) AS total_classes,
      ROUND((SUM(CASE WHEN attendance.status = 'Present' THEN 1 ELSE 0 END) / COUNT(attendance.id)) * 100, 2) AS attendance_percentage,
      CASE WHEN ROUND((SUM(CASE WHEN attendance.status = 'Present' THEN 1 ELSE 0 END) / COUNT(attendance.id)) * 100, 2) < ? THEN TRUE ELSE FALSE END AS is_low_attendance
     FROM attendance
     INNER JOIN students ON attendance.student_id = students.id
     INNER JOIN courses ON students.course_id = courses.id
     LEFT JOIN subjects ON attendance.subject_id = subjects.id
     INNER JOIN semesters ON attendance.semester_id = semesters.id
     INNER JOIN academic_years ON attendance.academic_year_id = academic_years.id
     ${whereClause}
     GROUP BY students.id, courses.id, subjects.id, semesters.id, academic_years.id
     ORDER BY attendance_percentage ASC, students.roll_no`,
    [LOW_ATTENDANCE_THRESHOLD, ...values]
  );
  return successResponse(res, "Attendance report fetched successfully", rows);
});

module.exports = {
  studentResults,
  semesterReport,
  coursePerformance,
  subjectPerformance,
  passFailReport,
  toppers,
  attendanceReport,
};
