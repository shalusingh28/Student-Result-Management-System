const createCrudRouter = require("./crud.routes");
const examController = require("../controllers/exam.controller");

module.exports = createCrudRouter(examController);
