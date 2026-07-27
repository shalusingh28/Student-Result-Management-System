const createCrudModel = require("./base.model");
const pool = require("../config/database");

const markModel = createCrudModel({
  table: "marks",
  fields: [
    "student_id",
    "exam_id",
    "subject_id",
    "internal_marks",
    "practical_marks",
    "external_marks",
    "total_marks",
    "grade",
    "result_status",
  ],
  select: `marks.*, students.name AS student_name, students.roll_no,
    exams.exam_name, subjects.name AS subject_name, subjects.code AS subject_code,
    exam_subjects.max_marks, exam_subjects.passing_marks,
    teachers.name AS teacher_name, teachers.employee_code`,
  joins: `LEFT JOIN students ON marks.student_id = students.id
    LEFT JOIN exams ON marks.exam_id = exams.id
    LEFT JOIN subjects ON marks.subject_id = subjects.id
    LEFT JOIN exam_subjects ON exam_subjects.exam_id = marks.exam_id AND exam_subjects.subject_id = marks.subject_id
    LEFT JOIN teachers ON exam_subjects.teacher_id = teachers.id`,
  filters: {
    studentId: "marks.student_id",
    student_id: "marks.student_id",
    examId: "marks.exam_id",
    exam_id: "marks.exam_id",
    subjectId: "marks.subject_id",
    subject_id: "marks.subject_id",
    resultStatus: "marks.result_status",
    result_status: "marks.result_status",
  },
});

markModel.findExamSubject = async (examId, subjectId) => {
  const [rows] = await pool.query(
    `SELECT exam_subjects.*, subjects.course_id, subjects.name AS subject_name, subjects.code AS subject_code,
      exams.course_id AS exam_course_id, teachers.name AS teacher_name, teachers.employee_code
     FROM exam_subjects
     INNER JOIN subjects ON exam_subjects.subject_id = subjects.id
     INNER JOIN exams ON exam_subjects.exam_id = exams.id
     LEFT JOIN teachers ON exam_subjects.teacher_id = teachers.id
     WHERE exam_subjects.exam_id = ? AND exam_subjects.subject_id = ?
     LIMIT 1`,
    [examId, subjectId]
  );

  return rows[0] || null;
};

module.exports = markModel;
