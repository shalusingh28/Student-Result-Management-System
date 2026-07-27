const crypto = require("crypto");

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, passwordHash) => {
  const [salt, storedHash] = String(passwordHash || "").split(":");
  if (!salt || !storedHash) return false;

  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(hash, "hex"));
};

module.exports = {
  hashPassword,
  verifyPassword,
};
