const createCrudController = require("./base.controller");
const departmentModel = require("../models/department.model");

module.exports = createCrudController(departmentModel, "Department");
