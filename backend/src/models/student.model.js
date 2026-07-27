const createCrudModel = require("./base.model");

module.exports = createCrudModel({
  table: "students",
  fields: [
    "user_id",
    "course_id",
    "name",
    "roll_no",
    "login_id",
    "login_username",
    "gender",
    "class_name",
    "fees_status",
    "attendance_status",
  ],
  select: `students.*, courses.name AS course_name, courses.code AS course_code,
    users.email AS user_email, users.username AS user_username`,
  joins: `LEFT JOIN courses ON students.course_id = courses.id
    LEFT JOIN users ON students.user_id = users.id`,
  filters: {
    courseId: "students.course_id",
    course_id: "students.course_id",
    userId: "students.user_id",
    user_id: "students.user_id",
    feesStatus: "students.fees_status",
    fees_status: "students.fees_status",
    attendanceStatus: "students.attendance_status",
    attendance_status: "students.attendance_status",
  },
});
