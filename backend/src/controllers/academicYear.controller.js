const createCrudController = require("./base.controller");
const academicYearModel = require("../models/academicYear.model");

module.exports = createCrudController(academicYearModel, "Academic Year");
