const createCrudModel = require("./base.model");

module.exports = createCrudModel({
  table: "subjects",
  fields: ["course_id", "name", "code", "max_marks", "description"],
  select: `subjects.*, courses.name AS course_name, courses.code AS course_code`,
  joins: "LEFT JOIN courses ON subjects.course_id = courses.id",
  filters: {
    courseId: "subjects.course_id",
    course_id: "subjects.course_id",
  },
});
