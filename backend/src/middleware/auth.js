const authModel = require("../models/auth.model");
const { errorResponse } = require("../utils/apiResponse");

const authenticate = async (req, res, next) => {
  try {
    const header = req.get("authorization") || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return errorResponse(res, "Authentication token is required", 401);
    }

    const session = await authModel.findSessionByToken(token);
    if (!session) {
      return errorResponse(res, "Invalid or expired token", 401);
    }

    const permissions = await authModel.getPermissionsByRoleId(session.role_id);
    const profileIds = await authModel.getProfileIds(session.id);

    req.user = {
      id: session.id,
      sessionId: session.session_id,
      roleId: session.role_id,
      role: session.role,
      name: session.name,
      email: session.email,
      username: session.username,
      permissions,
      ...profileIds,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) return errorResponse(res, "Authentication required", 401);
  if (req.user.role === "SUPER_ADMIN" || roles.includes(req.user.role)) return next();
  return errorResponse(res, "You do not have permission to access this resource", 403);
};

const requirePermissions = (...permissions) => (req, res, next) => {
  if (!req.user) return errorResponse(res, "Authentication required", 401);
  if (req.user.role === "SUPER_ADMIN") return next();

  const hasPermission = permissions.every((permission) => req.user.permissions.includes(permission));
  if (hasPermission) return next();

  return errorResponse(res, "Required permission missing", 403);
};

const requireOwnStudent = (paramName = "studentId") => (req, res, next) => {
  if (!req.user) return errorResponse(res, "Authentication required", 401);

  if (req.user.role !== "STUDENT") {
    return errorResponse(res, "Only STUDENT can access this private academic endpoint", 403);
  }

  const requestedStudentId = Number(req.params[paramName]);
  if (!req.user.studentId || requestedStudentId !== Number(req.user.studentId)) {
    return errorResponse(res, "Students can access only their own private academic data", 403);
  }

  return next();
};

module.exports = {
  authenticate,
  requireRoles,
  requirePermissions,
  requireOwnStudent,
};
