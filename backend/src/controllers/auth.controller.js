const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { verifyPassword } = require("../utils/password");
const authModel = require("../models/auth.model");

const formatUser = (user, permissions = [], profileIds = {}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  permissions,
  ...profileIds,
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return errorResponse(res, "identifier and password are required", 400);
  }

  const user = await authModel.findUserByIdentifier(identifier);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return errorResponse(res, "Invalid credentials", 401);
  }

  const permissions = await authModel.getPermissionsByRoleId(user.role_id);
  const profileIds = await authModel.getProfileIds(user.id);
  const session = await authModel.createSession(user.id, req);

  return successResponse(res, "Login successful", {
    token: session.token,
    expiresAt: session.expiresAt,
    user: formatUser(user, permissions, profileIds),
  });
});

const me = asyncHandler(async (req, res) => {
  return successResponse(res, "Authenticated user fetched successfully", req.user);
});

const logout = asyncHandler(async (req, res) => {
  await authModel.revokeSession(req.user.sessionId);
  return successResponse(res, "Logout successful");
});

module.exports = {
  login,
  me,
  logout,
};
