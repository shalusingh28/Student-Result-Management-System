const pool = require("../config/database");

const buildInsert = (table, fields, data) => {
  const columns = fields.filter((field) => data[field] !== undefined);
  const placeholders = columns.map(() => "?");
  const values = columns.map((field) => data[field]);

  if (!columns.length) {
    const error = new Error("No valid fields provided");
    error.statusCode = 400;
    throw error;
  }

  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    values,
  };
};

const buildUpdate = (table, fields, data, id) => {
  const columns = fields.filter((field) => data[field] !== undefined);
  const setClause = columns.map((field) => `${field} = ?`).join(", ");
  const values = columns.map((field) => data[field]);

  return {
    sql: `UPDATE ${table} SET ${setClause} WHERE id = ?`,
    values: [...values, id],
    hasChanges: columns.length > 0,
  };
};

const createCrudModel = ({ table, fields, select = `${table}.*`, joins = "", filters = {}, orderBy = `${table}.id DESC` }) => ({
  async findAll(query = {}) {
    const where = [];
    const values = [];

    Object.entries(filters).forEach(([queryKey, column]) => {
      if (query[queryKey] !== undefined && query[queryKey] !== "") {
        where.push(`${column} = ?`);
        values.push(query[queryKey]);
      }
    });

    const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT ${select} FROM ${table} ${joins}${whereClause} ORDER BY ${orderBy}`,
      values
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${select} FROM ${table} ${joins} WHERE ${table}.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const { sql, values } = buildInsert(table, fields, data);
    const [result] = await pool.query(sql, values);
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const { sql, values, hasChanges } = buildUpdate(table, fields, data, id);
    if (!hasChanges) return this.findById(id);

    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  },

  async remove(id) {
    const [result] = await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },
});

module.exports = createCrudModel;
