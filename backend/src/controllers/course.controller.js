const createCrudController = require("./base.controller");
const courseModel = require("../models/course.model");

module.exports = createCrudController(courseModel, "Course");
