const createCrudRouter = require("./crud.routes");
const studentController = require("../controllers/student.controller");

module.exports = createCrudRouter(studentController);
