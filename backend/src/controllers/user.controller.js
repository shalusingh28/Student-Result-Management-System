const createCrudController = require("./base.controller");
const userModel = require("../models/user.model");
const { hashPassword } = require("../utils/password");

const prepareCreate = async (data) => {
  if (!data.password && !data.password_hash) {
    const error = new Error("Password is required");
    error.statusCode = 400;
    throw error;
  }

  return {
    ...data,
    password_hash: data.password_hash || hashPassword(data.password),
    password: undefined,
  };
};

const prepareUpdate = async (data) => {
  if (data.password) {
    data.password_hash = hashPassword(data.password);
    delete data.password;
  }
  return data;
};

module.exports = createCrudController(userModel, "User", {
  beforeCreate: prepareCreate,
  beforeUpdate: prepareUpdate,
});
