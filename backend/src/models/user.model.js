const createCrudModel = require("./base.model");

module.exports = createCrudModel({
  table: "users",
  fields: ["role_id", "name", "email", "username", "password_hash", "status"],
  select: `users.id, users.role_id, roles.name AS role_name, users.name, users.email,
    users.username, users.status, users.created_at, users.updated_at`,
  joins: "LEFT JOIN roles ON users.role_id = roles.id",
  filters: {
    roleId: "users.role_id",
    role_id: "users.role_id",
    status: "users.status",
  },
});
