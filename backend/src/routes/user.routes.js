const createCrudRouter = require("./crud.routes");
const userController = require("../controllers/user.controller");

module.exports = createCrudRouter(userController);
