const pool = require("../config/database");
const createCrudModel = require("./base.model");

const resultSelect = `results.*, students.name AS student_name, students.roll_no,
  students.user_id AS student_user_id, exams.exam_name,
  reviewer.name AS reviewer_name, publisher.name AS publisher_name`;

const resultJoins = `LEFT JOIN students ON results.student_id = students.id
  LEFT JOIN exams ON results.exam_id = exams.id
  LEFT JOIN users reviewer ON results.reviewed_by = reviewer.id
  LEFT JOIN users publisher ON results.published_by = publisher.id`;

const resultModel = createCrudModel({
  table: "results",
  fields: [
    "student_id",
    "exam_id",
    "total_marks",
    "maximum_marks",
    "percentage",
    "gpa",
    "cgpa",
    "overall_grade",
    "final_result",
    "review_status",
    "reviewed_by",
    "reviewed_at",
    "review_notes",
    "published_by",
    "published_at",
  ],
  select: resultSelect,
  joins: resultJoins,
  filters: {
    studentId: "results.student_id",
    student_id: "results.student_id",
    examId: "results.exam_id",
    exam_id: "results.exam_id",
    reviewStatus: "results.review_status",
    review_status: "results.review_status",
    finalResult: "results.final_result",
    final_result: "results.final_result",
  },
});

resultModel.findMarksForCalculation = async (studentId, examId) => {
  const [rows] = await pool.query(
    `SELECT marks.total_marks, exam_subjects.max_marks
     FROM marks
     INNER JOIN exam_subjects ON exam_subjects.exam_id = marks.exam_id
      AND exam_subjects.subject_id = marks.subject_id
     WHERE marks.student_id = ? AND marks.exam_id = ?`,
    [studentId, examId]
  );
  return rows;
};

resultModel.upsertCalculatedResult = async (studentId, examId, resultData) => {
  await pool.query(
    `INSERT INTO results (
      student_id,
      exam_id,
      total_marks,
      maximum_marks,
      percentage,
      gpa,
      cgpa,
      overall_grade,
      final_result,
      review_status,
      reviewed_by,
      reviewed_at,
      review_notes,
      published_by,
      published_at
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Calculated', NULL, NULL, NULL, NULL, NULL)
     ON DUPLICATE KEY UPDATE
      total_marks = VALUES(total_marks),
      maximum_marks = VALUES(maximum_marks),
      percentage = VALUES(percentage),
      gpa = VALUES(gpa),
      cgpa = VALUES(cgpa),
      overall_grade = VALUES(overall_grade),
      final_result = VALUES(final_result),
      review_status = 'Calculated',
      reviewed_by = NULL,
      reviewed_at = NULL,
      review_notes = NULL,
      published_by = NULL,
      published_at = NULL`,
    [
      studentId,
      examId,
      resultData.total_marks,
      resultData.maximum_marks,
      resultData.percentage,
      resultData.gpa,
      resultData.cgpa,
      resultData.overall_grade,
      resultData.final_result,
    ]
  );

  const [rows] = await pool.query(
    `SELECT ${resultSelect} FROM results
     ${resultJoins}
     WHERE results.student_id = ? AND results.exam_id = ?`,
    [studentId, examId]
  );

  return rows[0] || null;
};

resultModel.reviewResult = async (id, reviewStatus, reviewNotes, reviewedBy) => {
  await pool.query(
    `UPDATE results
     SET review_status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [reviewStatus, reviewNotes || null, reviewedBy, id]
  );
  return resultModel.findById(id);
};

resultModel.publishResult = async (id, publishedBy) => {
  await pool.query(
    `UPDATE results
     SET review_status = 'Published', published_by = ?, published_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [publishedBy, id]
  );
  return resultModel.findById(id);
};

resultModel.createPublishedNotification = async (resultId) => {
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, is_read)
     SELECT students.user_id, 'Result Published',
      CONCAT('Your result for ', exams.exam_name, ' has been published.'),
      'Success', FALSE
     FROM results
     INNER JOIN students ON results.student_id = students.id
     INNER JOIN exams ON results.exam_id = exams.id
     WHERE results.id = ? AND students.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications existing
        WHERE existing.user_id = students.user_id
          AND existing.title = 'Result Published'
          AND existing.message = CONCAT('Your result for ', exams.exam_name, ' has been published.')
      )`,
    [resultId]
  );
  return result.affectedRows > 0;
};

resultModel.createMarksheetDocument = async (resultId, uploadedBy) => {
  const [result] = await pool.query(
    `INSERT INTO documents (student_id, uploaded_by, title, document_type, file_name, file_path, mime_type, file_size, status)
     SELECT results.student_id, ?, CONCAT(students.name, ' ', exams.exam_name, ' Marksheet'),
      'Marksheet',
      CONCAT('marksheet-', results.student_id, '-', results.exam_id, '.json'),
      CONCAT('/marksheets/student-', results.student_id, '/exam-', results.exam_id, '.json'),
      'application/json', 0, 'Active'
     FROM results
     INNER JOIN students ON results.student_id = students.id
     INNER JOIN exams ON results.exam_id = exams.id
     WHERE results.id = ?
      AND NOT EXISTS (
        SELECT 1 FROM documents existing
        WHERE existing.student_id = results.student_id
          AND existing.document_type = 'Marksheet'
          AND existing.file_path = CONCAT('/marksheets/student-', results.student_id, '/exam-', results.exam_id, '.json')
      )`,
    [uploadedBy, resultId]
  );
  return result.affectedRows > 0;
};

module.exports = resultModel;
