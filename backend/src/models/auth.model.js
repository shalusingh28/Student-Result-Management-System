const crypto = require("crypto");
const pool = require("../config/database");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const findUserByIdentifier = async (identifier) => {
  const [rows] = await pool.query(
    `SELECT users.id, users.role_id, users.name, users.email, users.username,
      users.password_hash, users.status, roles.name AS role
     FROM users
     INNER JOIN roles ON users.role_id = roles.id
     WHERE (users.username = ? OR users.email = ?) AND users.status = 'Active'
     LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0] || null;
};

const getPermissionsByRoleId = async (roleId) => {
  const [rows] = await pool.query(
    `SELECT permissions.name
     FROM permissions
     INNER JOIN role_permissions ON permissions.id = role_permissions.permission_id
     WHERE role_permissions.role_id = ?
     ORDER BY permissions.name`,
    [roleId]
  );
  return rows.map((row) => row.name);
};

const getProfileIds = async (userId) => {
  const [[student]] = await pool.query("SELECT id FROM students WHERE user_id = ? LIMIT 1", [userId]);
  const [[teacher]] = await pool.query("SELECT id FROM teachers WHERE user_id = ? LIMIT 1", [userId]);

  return {
    studentId: student ? student.id : null,
    teacherId: teacher ? teacher.id : null,
  };
};

const createSession = async (userId, req) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const sessionHours = Number(process.env.AUTH_SESSION_HOURS) || 24;
  const expiresAt = new Date(Date.now() + sessionHours * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, req.ip || null, req.get("user-agent") || null]
  );

  return { token, expiresAt };
};

const findSessionByToken = async (token) => {
  const tokenHash = hashToken(token);
  const [rows] = await pool.query(
    `SELECT user_sessions.id AS session_id, user_sessions.expires_at, users.id,
      users.role_id, users.name, users.email, users.username, users.status,
      roles.name AS role
     FROM user_sessions
     INNER JOIN users ON user_sessions.user_id = users.id
     INNER JOIN roles ON users.role_id = roles.id
     WHERE user_sessions.token_hash = ?
      AND user_sessions.revoked_at IS NULL
      AND user_sessions.expires_at > NOW()
      AND users.status = 'Active'
     LIMIT 1`,
    [tokenHash]
  );

  const session = rows[0] || null;
  if (session) {
    await pool.query("UPDATE user_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?", [session.session_id]);
  }
  return session;
};

const revokeSession = async (sessionId) => {
  await pool.query("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?", [sessionId]);
};

module.exports = {
  findUserByIdentifier,
  getPermissionsByRoleId,
  getProfileIds,
  createSession,
  findSessionByToken,
  revokeSession,
};
