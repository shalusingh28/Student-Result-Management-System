const createCrudController = require("./base.controller");
const subjectModel = require("../models/subject.model");

module.exports = createCrudController(subjectModel, "Subject");
