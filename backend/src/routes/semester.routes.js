const createCrudRouter = require("./crud.routes");
const semesterController = require("../controllers/semester.controller");

module.exports = createCrudRouter(semesterController);
