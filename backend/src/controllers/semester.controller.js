const createCrudController = require("./base.controller");
const semesterModel = require("../models/semester.model");

module.exports = createCrudController(semesterModel, "Semester");
