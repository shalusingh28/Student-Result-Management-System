const createCrudRouter = require("./crud.routes");
const departmentController = require("../controllers/department.controller");

module.exports = createCrudRouter(departmentController);
