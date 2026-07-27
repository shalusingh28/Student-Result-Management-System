const asyncHandler = require("../utils/asyncHandler");
const normalizeKeys = require("../utils/normalizeKeys");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const createCrudController = (model, entityName, options = {}) => ({
  getAll: asyncHandler(async (req, res) => {
    const records = await model.findAll(req.query);
    return successResponse(res, `${entityName} fetched successfully`, records);
  }),

  getById: asyncHandler(async (req, res) => {
    const record = await model.findById(req.params.id);
    if (!record) return errorResponse(res, `${entityName} not found`, 404);
    return successResponse(res, `${entityName} fetched successfully`, record);
  }),

  create: asyncHandler(async (req, res) => {
    let data = normalizeKeys(req.body);
    if (options.beforeCreate) data = await options.beforeCreate(data, req);

    const record = await model.create(data);
    return successResponse(res, `${entityName} created successfully`, record, 201);
  }),

  update: asyncHandler(async (req, res) => {
    let data = normalizeKeys(req.body);
    if (options.beforeUpdate) data = await options.beforeUpdate(data, req);

    const record = await model.update(req.params.id, data);
    if (!record) return errorResponse(res, `${entityName} not found`, 404);
    return successResponse(res, `${entityName} updated successfully`, record);
  }),

  remove: asyncHandler(async (req, res) => {
    const deleted = await model.remove(req.params.id);
    if (!deleted) return errorResponse(res, `${entityName} not found`, 404);
    return successResponse(res, `${entityName} deleted successfully`);
  }),
});

module.exports = createCrudController;
