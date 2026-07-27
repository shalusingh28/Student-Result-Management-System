const createCrudModel = require("./base.model");

module.exports = createCrudModel({
  table: "academic_years",
  fields: ["year_name", "start_date", "end_date", "status"],
  filters: {
    status: "academic_years.status",
  },
});
