const createCrudController = require("./base.controller");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { calculateResult } = require("../utils/resultCalculator");
const resultModel = require("../models/result.model");

const REVIEW_STATUSES = ["Under Review", "Approved", "Rejected"];

const resultController = createCrudController(resultModel, "Result");

resultController.calculate = asyncHandler(async (req, res) => {
  const studentId = req.body.studentId || req.body.student_id;
  const examId = req.body.examId || req.body.exam_id;

  if (!studentId || !examId) {
    return errorResponse(res, "studentId and examId are required", 400);
  }

  const marks = await resultModel.findMarksForCalculation(studentId, examId);
  if (!marks.length) {
    return errorResponse(res, "Marks not found for this student and exam", 404);
  }

  const calculatedResult = calculateResult(marks);
  const result = await resultModel.upsertCalculatedResult(studentId, examId, calculatedResult);

  return successResponse(res, "Result calculated and sent for admin review", result, 201);
});

resultController.review = asyncHandler(async (req, res) => {
  const reviewStatus = req.body.reviewStatus || req.body.review_status;
  const reviewNotes = req.body.reviewNotes || req.body.review_notes;

  if (!REVIEW_STATUSES.includes(reviewStatus)) {
    return errorResponse(res, `reviewStatus must be one of: ${REVIEW_STATUSES.join(", ")}`, 400);
  }

  const existingResult = await resultModel.findById(req.params.id);
  if (!existingResult) return errorResponse(res, "Result not found", 404);

  if (existingResult.review_status === "Published") {
    return errorResponse(res, "Published result cannot be reviewed again", 400);
  }

  const result = await resultModel.reviewResult(req.params.id, reviewStatus, reviewNotes, req.user.id);
  return successResponse(res, "Result reviewed successfully", result);
});

resultController.publish = asyncHandler(async (req, res) => {
  const existingResult = await resultModel.findById(req.params.id);
  if (!existingResult) return errorResponse(res, "Result not found", 404);

  if (existingResult.review_status === "Published") {
    return successResponse(res, "Result is already published", existingResult);
  }

  if (existingResult.review_status !== "Approved") {
    return errorResponse(res, "Only approved results can be published", 400);
  }

  const result = await resultModel.publishResult(req.params.id, req.user.id);
  await resultModel.createPublishedNotification(req.params.id);
  await resultModel.createMarksheetDocument(req.params.id, req.user.id);

  return successResponse(res, "Result published, student notified, and marksheet document created", result);
});

module.exports = resultController;
