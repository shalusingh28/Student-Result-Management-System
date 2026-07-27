const createCrudController = require("./base.controller");
const roleModel = require("../models/role.model");

module.exports = createCrudController(roleModel, "Role");
