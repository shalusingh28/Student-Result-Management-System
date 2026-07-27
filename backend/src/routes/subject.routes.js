const createCrudRouter = require("./crud.routes");
const subjectController = require("../controllers/subject.controller");

module.exports = createCrudRouter(subjectController);
