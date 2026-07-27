const createCrudController = require("./base.controller");
const studentModel = require("../models/student.model");

module.exports = createCrudController(studentModel, "Student");
