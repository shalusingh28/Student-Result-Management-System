const createCrudController = require("./base.controller");
const markModel = require("../models/mark.model");
const { calculateGrade } = require("../utils/resultCalculator");

const MARK_FIELDS = ["internal_marks", "practical_marks", "external_marks"];
const REQUIRED_CREATE_FIELDS = ["student_id", "exam_id", "subject_id"];

const createValidationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeNumber = (value, field) => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    throw createValidationError(`${field} must be a valid number`);
  }
  if (number < 0) {
    throw createValidationError(`${field} cannot be negative`);
  }
  return number;
};

const normalizeId = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw createValidationError(`${field} must be a positive number`);
  }
  return number;
};

const rejectManualTotal = (data) => {
  if (data.total_marks !== undefined) {
    throw createValidationError("total_marks is calculated automatically from internal_marks + practical_marks + external_marks");
  }
};

const ensureTeacherCanEnterMarks = (req, examSubject) => {
  if (req.user.role !== "TEACHER") return;

  if (!req.user.teacherId) {
    throw createValidationError("Teacher profile not found for this user", 403);
  }

  if (Number(examSubject.teacher_id) !== Number(req.user.teacherId)) {
    throw createValidationError("Teachers can enter marks only for their assigned exam subject", 403);
  }
};

const buildCalculatedMarkData = async (data, req, existingMark = null) => {
  rejectManualTotal(data);

  REQUIRED_CREATE_FIELDS.forEach((field) => {
    if (!existingMark && (data[field] === undefined || data[field] === "" || data[field] === null)) {
      throw createValidationError(`${field} is required`);
    }
  });

  const merged = {
    ...existingMark,
    ...data,
  };

  merged.student_id = normalizeId(merged.student_id, "student_id");
  merged.exam_id = normalizeId(merged.exam_id, "exam_id");
  merged.subject_id = normalizeId(merged.subject_id, "subject_id");

  MARK_FIELDS.forEach((field) => {
    merged[field] = normalizeNumber(merged[field] === undefined || merged[field] === null || merged[field] === "" ? 0 : merged[field], field);
  });

  const examSubject = await markModel.findExamSubject(merged.exam_id, merged.subject_id);
  if (!examSubject) {
    throw createValidationError("Subject is not assigned to this exam");
  }

  ensureTeacherCanEnterMarks(req, examSubject);

  const totalMarks = MARK_FIELDS.reduce((total, field) => total + Number(merged[field]), 0);
  const maxMarks = Number(examSubject.max_marks || 100);
  const passingMarks = Number(examSubject.passing_marks || 0);

  if (totalMarks > maxMarks) {
    throw createValidationError(`total_marks cannot be greater than maximum marks (${maxMarks})`);
  }

  const percentage = maxMarks ? (totalMarks / maxMarks) * 100 : 0;

  return {
    student_id: merged.student_id,
    exam_id: merged.exam_id,
    subject_id: merged.subject_id,
    internal_marks: merged.internal_marks,
    practical_marks: merged.practical_marks,
    external_marks: merged.external_marks,
    total_marks: totalMarks,
    grade: calculateGrade(percentage),
    result_status: totalMarks >= passingMarks ? "Pass" : "Fail",
  };
};

module.exports = createCrudController(markModel, "Mark", {
  beforeCreate: async (data, req) => buildCalculatedMarkData(data, req),
  beforeUpdate: async (data, req) => {
    const existingMark = await markModel.findById(req.params.id);
    if (!existingMark) {
      return data;
    }

    return buildCalculatedMarkData(data, req, existingMark);
  },
});
