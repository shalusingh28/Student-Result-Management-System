const pool = require("../config/database");

const examSelect = `
  exams.*,
  courses.name AS course_name,
  courses.code AS course_code,
  academic_years.year_name,
  semesters.semester_name,
  exam_subjects.id AS exam_subject_id,
  exam_subjects.subject_id,
  exam_subjects.teacher_id,
  exam_subjects.exam_date,
  exam_subjects.start_time,
  exam_subjects.end_time,
  exam_subjects.max_marks,
  exam_subjects.passing_marks,
  subjects.name AS subject_name,
  subjects.code AS subject_code,
  teachers.name AS teacher_name,
  teachers.employee_code
`;

const examJoins = `
  LEFT JOIN courses ON exams.course_id = courses.id
  LEFT JOIN academic_years ON exams.academic_year_id = academic_years.id
  LEFT JOIN semesters ON exams.semester_id = semesters.id
  LEFT JOIN exam_subjects ON exam_subjects.exam_id = exams.id
  LEFT JOIN subjects ON exam_subjects.subject_id = subjects.id
  LEFT JOIN teachers ON exam_subjects.teacher_id = teachers.id
`;

const examFields = [
  "exam_name",
  "exam_type",
  "course_id",
  "academic_year_id",
  "semester_id",
  "start_date",
  "end_date",
  "status",
];

const examSubjectFields = [
  "subject_id",
  "teacher_id",
  "exam_date",
  "start_time",
  "end_time",
  "max_marks",
  "passing_marks",
];

const buildExamData = (data) => {
  return examFields.reduce((examData, field) => {
    if (data[field] !== undefined) examData[field] = data[field];
    return examData;
  }, {});
};

const buildExamSubjectData = (data) => {
  return examSubjectFields.reduce((subjectData, field) => {
    if (data[field] !== undefined) subjectData[field] = data[field];
    return subjectData;
  }, {});
};

const buildInsert = (table, data) => {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((column) => data[column]);

  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
  };
};

const buildUpdate = (table, data, whereColumn = "id") => {
  const columns = Object.keys(data);
  const setClause = columns.map((column) => `${column} = ?`).join(", ");
  const values = columns.map((column) => data[column]);

  return {
    sql: `UPDATE ${table} SET ${setClause} WHERE ${whereColumn} = ?`,
    values,
    hasChanges: columns.length > 0,
  };
};

const getExamById = async (id, connection = pool) => {
  const [rows] = await connection.query(
    `SELECT ${examSelect}
     FROM exams
     ${examJoins}
     WHERE exams.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const ensureSubjectBelongsToCourse = async (courseId, subjectId, connection = pool) => {
  const [rows] = await connection.query(
    "SELECT id FROM subjects WHERE id = ? AND course_id = ? LIMIT 1",
    [subjectId, courseId]
  );

  if (!rows.length) {
    const error = new Error("Selected subject does not belong to selected course");
    error.statusCode = 400;
    throw error;
  }
};

const examModel = {
  async findAll(query = {}) {
    const where = [];
    const values = [];
    const filters = {
      course_id: "exams.course_id",
      courseId: "exams.course_id",
      academic_year_id: "exams.academic_year_id",
      academicYearId: "exams.academic_year_id",
      semester_id: "exams.semester_id",
      semesterId: "exams.semester_id",
      subject_id: "exam_subjects.subject_id",
      subjectId: "exam_subjects.subject_id",
      exam_type: "exams.exam_type",
      examType: "exams.exam_type",
      status: "exams.status",
    };

    Object.entries(filters).forEach(([queryKey, column]) => {
      if (query[queryKey] !== undefined && query[queryKey] !== "") {
        where.push(`${column} = ?`);
        values.push(query[queryKey]);
      }
    });

    const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT ${examSelect}
       FROM exams
       ${examJoins}
       ${whereClause}
       ORDER BY exams.id DESC`,
      values
    );

    return rows;
  },

  async findById(id) {
    return getExamById(id);
  },

  async create(data) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await ensureSubjectBelongsToCourse(data.course_id, data.subject_id, connection);

      const examData = buildExamData(data);
      const examSubjectData = buildExamSubjectData({
        exam_date: data.exam_date || data.start_date,
        ...data,
      });
      const { sql, values } = buildInsert("exams", examData);
      const [result] = await connection.query(sql, values);

      const { sql: subjectSql, values: subjectValues } = buildInsert("exam_subjects", {
        exam_id: result.insertId,
        ...examSubjectData,
      });
      await connection.query(subjectSql, subjectValues);

      const record = await getExamById(result.insertId, connection);
      await connection.commit();
      return record;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async update(id, data) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const current = await getExamById(id, connection);
      if (!current) {
        await connection.rollback();
        return null;
      }

      const courseId = data.course_id !== undefined ? data.course_id : current.course_id;
      const subjectId = data.subject_id !== undefined ? data.subject_id : current.subject_id;
      if (courseId && subjectId) await ensureSubjectBelongsToCourse(courseId, subjectId, connection);

      const examData = buildExamData(data);
      const examUpdate = buildUpdate("exams", examData);
      if (examUpdate.hasChanges) {
        await connection.query(examUpdate.sql, [...examUpdate.values, id]);
      }

      const examSubjectData = buildExamSubjectData(data);
      if (Object.keys(examSubjectData).length) {
        const [existingRows] = await connection.query("SELECT id FROM exam_subjects WHERE exam_id = ? LIMIT 1", [id]);

        if (existingRows.length) {
          const subjectUpdate = buildUpdate("exam_subjects", examSubjectData, "exam_id");
          await connection.query(subjectUpdate.sql, [...subjectUpdate.values, id]);
        } else {
          const { sql, values } = buildInsert("exam_subjects", {
            exam_id: id,
            ...examSubjectData,
          });
          await connection.query(sql, values);
        }
      }

      const record = await getExamById(id, connection);
      await connection.commit();
      return record;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async remove(id) {
    const [result] = await pool.query("DELETE FROM exams WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

module.exports = examModel;
