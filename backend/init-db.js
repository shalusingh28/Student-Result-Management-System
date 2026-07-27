require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const schemaPath = path.join(__dirname, "src", "sql", "schema.sql");
const seedPath = path.join(__dirname, "src", "sql", "seed.sql");
const databaseName = process.env.DB_NAME || process.env.MYSQLDATABASE || "student_result_db";

const runSqlFile = async (connection, filePath, label) => {
  const sql = fs.readFileSync(filePath, "utf8").replaceAll("student_result_db", databaseName);
  await connection.query(sql);
  console.log(`${label} completed successfully.`);
};

const recordExists = async (connection, sql, values) => {
  const [rows] = await connection.query(sql, values);
  return rows.length > 0;
};

const ensureExaminationSchema = async (connection, databaseName) => {
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  await connection.query(`DELETE FROM ${databaseName}.results`);
  await connection.query(`DELETE FROM ${databaseName}.marks`);
  await connection.query(`DELETE FROM ${databaseName}.exam_subjects`);
  await connection.query(`DELETE FROM ${databaseName}.exams`);
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");

  const hasCourseId = await recordExists(
    connection,
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND COLUMN_NAME = 'course_id'`,
    [databaseName]
  );

  if (!hasCourseId) {
    await connection.query(`ALTER TABLE ${databaseName}.exams ADD COLUMN course_id INT NULL AFTER exam_type`);
  }

  const hasOldExamIndex = await recordExists(
    connection,
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND INDEX_NAME = 'unique_exam_period'`,
    [databaseName]
  );

  if (hasOldExamIndex) {
    await connection.query(`ALTER TABLE ${databaseName}.exams DROP INDEX unique_exam_period`);
  }

  await connection.query(`
    ALTER TABLE ${databaseName}.exams
      MODIFY exam_type ENUM('Internal', 'Mid-Term', 'Practical', 'Final', 'Semester') NOT NULL,
      MODIFY course_id INT NOT NULL,
      MODIFY start_date DATE NOT NULL,
      MODIFY end_date DATE NOT NULL,
      MODIFY status ENUM('Draft', 'Open', 'Published', 'Closed') NOT NULL DEFAULT 'Draft',
      ADD UNIQUE KEY unique_exam_period (exam_name, course_id, academic_year_id, semester_id)
  `);

  const hasCourseFk = await recordExists(
    connection,
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND CONSTRAINT_NAME = 'fk_exams_course'`,
    [databaseName]
  );

  if (!hasCourseFk) {
    await connection.query(`ALTER TABLE ${databaseName}.exams ADD CONSTRAINT fk_exams_course FOREIGN KEY (course_id) REFERENCES ${databaseName}.courses(id)`);
  }

  const hasExamDateCheck = await recordExists(
    connection,
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND CONSTRAINT_NAME = 'chk_exams_date_range'`,
    [databaseName]
  );

  if (!hasExamDateCheck) {
    await connection.query(`ALTER TABLE ${databaseName}.exams ADD CONSTRAINT chk_exams_date_range CHECK (end_date >= start_date)`);
  }

  const hasExamSubjectMarksCheck = await recordExists(
    connection,
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exam_subjects' AND CONSTRAINT_NAME = 'chk_exam_subjects_marks'`,
    [databaseName]
  );

  if (!hasExamSubjectMarksCheck) {
    await connection.query(`ALTER TABLE ${databaseName}.exam_subjects ADD CONSTRAINT chk_exam_subjects_marks CHECK (passing_marks <= max_marks)`);
  }

  const hasMarksTotalSumCheck = await recordExists(
    connection,
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'marks' AND CONSTRAINT_NAME = 'chk_marks_total_sum'`,
    [databaseName]
  );

  if (!hasMarksTotalSumCheck) {
    await connection.query(`ALTER TABLE ${databaseName}.marks ADD CONSTRAINT chk_marks_total_sum CHECK (total_marks = internal_marks + practical_marks + external_marks)`);
  }

  const resultColumns = [
    ["review_status", "ENUM('Calculated', 'Under Review', 'Approved', 'Rejected', 'Published') NOT NULL DEFAULT 'Calculated' AFTER final_result"],
    ["reviewed_by", "INT NULL AFTER review_status"],
    ["reviewed_at", "TIMESTAMP NULL AFTER reviewed_by"],
    ["review_notes", "TEXT NULL AFTER reviewed_at"],
    ["published_by", "INT NULL AFTER review_notes"],
  ];

  for (const [columnName, definition] of resultColumns) {
    const hasColumn = await recordExists(
      connection,
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'results' AND COLUMN_NAME = ?`,
      [databaseName, columnName]
    );

    if (!hasColumn) {
      await connection.query(`ALTER TABLE ${databaseName}.results ADD COLUMN ${columnName} ${definition}`);
    }
  }

  await connection.query(`
    ALTER TABLE ${databaseName}.results
      MODIFY review_status ENUM('Calculated', 'Under Review', 'Approved', 'Rejected', 'Published') NOT NULL DEFAULT 'Calculated',
      MODIFY published_at TIMESTAMP NULL DEFAULT NULL
  `);

  const resultForeignKeys = [
    ["fk_results_reviewed_by", "reviewed_by"],
    ["fk_results_published_by", "published_by"],
  ];

  for (const [constraintName, columnName] of resultForeignKeys) {
    const hasConstraint = await recordExists(
      connection,
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'results' AND CONSTRAINT_NAME = ?`,
      [databaseName, constraintName]
    );

    if (!hasConstraint) {
      await connection.query(`ALTER TABLE ${databaseName}.results ADD CONSTRAINT ${constraintName} FOREIGN KEY (${columnName}) REFERENCES ${databaseName}.users(id) ON DELETE SET NULL`);
    }
  }

  const resultIndexes = [
    ["idx_results_review_status", "review_status"],
    ["idx_results_published_at", "published_at"],
    ["idx_results_exam_status", "exam_id, review_status"],
  ];

  for (const [indexName, columns] of resultIndexes) {
    const hasIndex = await recordExists(
      connection,
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'results' AND INDEX_NAME = ?`,
      [databaseName, indexName]
    );

    if (!hasIndex) {
      await connection.query(`ALTER TABLE ${databaseName}.results ADD INDEX ${indexName} (${columns})`);
    }
  }

  console.log("Examination schema sync completed successfully.");
};

const main = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    multipleStatements: true,
  });

  try {
    await runSqlFile(connection, schemaPath, "Schema setup");
    await ensureExaminationSchema(connection, databaseName);
    await runSqlFile(connection, seedPath, "Seed data setup");

    const [counts] = await connection.query(`
      SELECT 'departments' AS module, COUNT(*) AS total FROM ${databaseName}.departments
      UNION ALL SELECT 'courses', COUNT(*) FROM ${databaseName}.courses
      UNION ALL SELECT 'subjects', COUNT(*) FROM ${databaseName}.subjects
      UNION ALL SELECT 'academic_years', COUNT(*) FROM ${databaseName}.academic_years
      UNION ALL SELECT 'semesters', COUNT(*) FROM ${databaseName}.semesters
      UNION ALL SELECT 'exams', COUNT(*) FROM ${databaseName}.exams
      UNION ALL SELECT 'exam_subjects', COUNT(*) FROM ${databaseName}.exam_subjects
      UNION ALL SELECT 'marks', COUNT(*) FROM ${databaseName}.marks
      UNION ALL SELECT 'results', COUNT(*) FROM ${databaseName}.results
    `);

    console.log("\nAcademic, Examination, and Marks data count:");
    console.table(counts);
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error("Database init failed:", error.message);
  process.exit(1);
});
