const createCrudRouter = require("./crud.routes");
const courseController = require("../controllers/course.controller");

module.exports = createCrudRouter(courseController);
