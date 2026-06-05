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
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS qr_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      qr_src TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await runQuery(createTableQuery);
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

// Database operations
const dbOperations = {
  // Get all QR codes (latest first)
  getAll: async () => {
    return await allQuery("SELECT * FROM qr_codes ORDER BY created_at DESC");
  },

  // Get single QR code by ID
  getById: async (id) => {
    return await getQuery("SELECT * FROM qr_codes WHERE id = ?", [id]);
  },

  // Create new QR code
  create: async (qrData) => {
    const { name, url, qrSrc } = qrData;

    // Insert the new QR code
    const result = await runQuery(
      "INSERT INTO qr_codes (name, url, qr_src) VALUES (?, ?, ?)",
      [name, url, qrSrc],
    );

    // Get the last inserted ID and return the full record
    const id = result.lastID;
    return await dbOperations.getById(id);
  },

  // Update QR code
  update: async (id, updates) => {
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

    await runQuery(
      `UPDATE qr_codes SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return await dbOperations.getById(id);
  },

  // Delete QR code
  delete: async (id) => {
    await runQuery("DELETE FROM qr_codes WHERE id = ?", [id]);
    return true;
  },
};

export { db, initDatabase, dbOperations };
