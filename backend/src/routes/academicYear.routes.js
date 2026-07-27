const createCrudRouter = require("./crud.routes");
const academicYearController = require("../controllers/academicYear.controller");

module.exports = createCrudRouter(academicYearController);
