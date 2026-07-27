const { errorResponse } = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  if (err.code === "ER_DUP_ENTRY") {
    return errorResponse(res, "Duplicate record already exists", 409);
  }

  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return errorResponse(res, "Record is in use and cannot be deleted", 409);
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return errorResponse(res, "Referenced record does not exist", 400);
  }

  return errorResponse(res, err.message || "Internal server error", statusCode);
};

module.exports = errorHandler;
