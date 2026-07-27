const asyncHandler = require("../utils/asyncHandler");
const normalizeKeys = require("../utils/normalizeKeys");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const examModel = require("../models/exam.model");

const EXAM_TYPES = ["Internal", "Mid-Term", "Practical", "Final", "Semester"];
const EXAM_STATUSES = ["Draft", "Open", "Published", "Closed"];
const REQUIRED_CREATE_FIELDS = [
  "exam_name",
  "exam_type",
  "course_id",
  "academic_year_id",
  "semester_id",
  "subject_id",
  "start_date",
  "end_date",
  "max_marks",
  "passing_marks",
  "status",
];
const NUMBER_FIELDS = ["course_id", "academic_year_id", "semester_id", "subject_id", "teacher_id", "max_marks", "passing_marks"];

const normalizeExamPayload = (payload) => {
  const data = normalizeKeys(payload);

  NUMBER_FIELDS.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== "") {
      data[field] = Number(data[field]);
    }
  });

  return data;
};

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const validateExamPayload = (data, isCreate = true) => {
  if (isCreate) {
    const missingField = REQUIRED_CREATE_FIELDS.find((field) => !hasValue(data[field]));
    if (missingField) return `${missingField} is required`;
  }

  if (hasValue(data.exam_type) && !EXAM_TYPES.includes(data.exam_type)) {
    return `exam_type must be one of: ${EXAM_TYPES.join(", ")}`;
  }

  if (hasValue(data.status) && !EXAM_STATUSES.includes(data.status)) {
    return `status must be one of: ${EXAM_STATUSES.join(", ")}`;
  }

  ["course_id", "academic_year_id", "semester_id", "subject_id", "teacher_id"].forEach((field) => {
    if (hasValue(data[field]) && (!Number.isInteger(data[field]) || data[field] <= 0)) {
      data.__validationError = `${field} must be a positive number`;
    }
  });

  if (data.__validationError) {
    const message = data.__validationError;
    delete data.__validationError;
    return message;
  }

  if (hasValue(data.max_marks) && (Number.isNaN(data.max_marks) || data.max_marks <= 0)) {
    return "max_marks must be greater than 0";
  }

  if (hasValue(data.passing_marks) && (Number.isNaN(data.passing_marks) || data.passing_marks < 0)) {
    return "passing_marks must be 0 or greater";
  }

  if (hasValue(data.max_marks) && hasValue(data.passing_marks) && data.passing_marks > data.max_marks) {
    return "passing_marks cannot be greater than max_marks";
  }

  if (hasValue(data.start_date) && hasValue(data.end_date)) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return "start_date and end_date must be valid dates";
    }

    if (endDate < startDate) {
      return "end_date cannot be before start_date";
    }
  }

  return null;
};

const getAll = asyncHandler(async (req, res) => {
  const records = await examModel.findAll(req.query);
  return successResponse(res, "Exam fetched successfully", records);
});

const getById = asyncHandler(async (req, res) => {
  const record = await examModel.findById(req.params.id);
  if (!record) return errorResponse(res, "Exam not found", 404);
  return successResponse(res, "Exam fetched successfully", record);
});

const create = asyncHandler(async (req, res) => {
  const data = normalizeExamPayload(req.body);
  const validationError = validateExamPayload(data);
  if (validationError) return errorResponse(res, validationError, 400);

  const record = await examModel.create(data);
  return successResponse(res, "Exam created successfully", record, 201);
});

const update = asyncHandler(async (req, res) => {
  const data = normalizeExamPayload(req.body);
  const validationError = validateExamPayload(data, false);
  if (validationError) return errorResponse(res, validationError, 400);

  const record = await examModel.update(req.params.id, data);
  if (!record) return errorResponse(res, "Exam not found", 404);
  return successResponse(res, "Exam updated successfully", record);
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await examModel.remove(req.params.id);
  if (!deleted) return errorResponse(res, "Exam not found", 404);
  return successResponse(res, "Exam deleted successfully");
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
