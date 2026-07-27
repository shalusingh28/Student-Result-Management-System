const createCrudModel = require("./base.model");

module.exports = createCrudModel({
  table: "semesters",
  fields: ["semester_name", "start_date", "end_date", "status"],
  filters: {
    status: "semesters.status",
  },
});
