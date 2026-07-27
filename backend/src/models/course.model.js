const createCrudModel = require("./base.model");

module.exports = createCrudModel({
  table: "courses",
  fields: ["department_id", "name", "code", "duration", "description"],
  select: `courses.*, departments.name AS department_name, departments.code AS department_code`,
  joins: "LEFT JOIN departments ON courses.department_id = departments.id",
  filters: {
    departmentId: "courses.department_id",
    department_id: "courses.department_id",
  },
});
