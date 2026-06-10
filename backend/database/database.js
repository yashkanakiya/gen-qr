import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const dbPath = join(__dirname, "../qr_codes.db");
const db = new sqlite3.Database(dbPath);

// Helper function to run queries with promises
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Initialize database tables
const initDatabase = async () => {
  const createQRCodesTable = `
    CREATE TABLE IF NOT EXISTS qr_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      qr_src TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await runQuery(createUsersTable);
    await runQuery(createQRCodesTable);
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

// Database operations
const dbOperations = {
  // User operations
  createUser: async (userData) => {
    const { username, email, password } = userData;
    const result = await runQuery(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password]
    );
    return await dbOperations.getUserById(result.lastID);
  },

  getUserByEmail: async (email) => {
    return await getQuery("SELECT * FROM users WHERE email = ?", [email]);
  },

  getUserById: async (id) => {
    return await getQuery("SELECT id, username, email, created_at FROM users WHERE id = ?", [id]);
  },

  // QR Code operations (updated with user_id)
  getAll: async (userId) => {
    return await allQuery(
      "SELECT * FROM qr_codes WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
  },

  getById: async (id, userId) => {
    return await getQuery(
      "SELECT * FROM qr_codes WHERE id = ? AND user_id = ?",
      [id, userId]
    );
  },

  create: async (qrData, userId) => {
    const { name, url, qrSrc } = qrData;
    const result = await runQuery(
      "INSERT INTO qr_codes (name, url, qr_src, user_id) VALUES (?, ?, ?, ?)",
      [name, url, qrSrc, userId]
    );
    return await dbOperations.getById(result.lastID, userId);
  },

  update: async (id, userId, updates) => {
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.url) {
      fields.push("url = ?");
      values.push(updates.url);
    }
    if (updates.qrSrc) {
      fields.push("qr_src = ?");
      values.push(updates.qrSrc);
    }

    if (fields.length === 0) return null;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    values.push(userId);

    await runQuery(
      `UPDATE qr_codes SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
      values
    );

    return await dbOperations.getById(id, userId);
  },

  delete: async (id, userId) => {
    await runQuery("DELETE FROM qr_codes WHERE id = ? AND user_id = ?", [id, userId]);
    return true;
  },
};

export { db, initDatabase, dbOperations };