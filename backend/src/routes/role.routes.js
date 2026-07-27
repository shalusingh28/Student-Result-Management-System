const createCrudRouter = require("./crud.routes");
const roleController = require("../controllers/role.controller");

module.exports = createCrudRouter(roleController);
