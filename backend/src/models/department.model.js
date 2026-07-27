const createCrudModel = require("./base.model");

module.exports = createCrudModel({
  table: "departments",
  fields: ["name", "code", "description"],
});
