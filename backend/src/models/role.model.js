const createCrudModel = require("./base.model");

module.exports = createCrudModel({
  table: "roles",
  fields: ["name", "description"],
});
