// database/database.js
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

// Helper to generate unique slug
const generateSlug = () => {
  return Math.random().toString(36).substring(2, 10) + 
         Date.now().toString(36);
};

// Helper to parse user agent
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  let deviceType = 'Unknown';
  let browser = 'Unknown';
  let os = 'Unknown';

  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    deviceType = 'Mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    deviceType = 'Tablet';
  } else {
    deviceType = 'Desktop';
  }

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { deviceType, browser, os };
};

// Get country from IP (simplified)
const getCountryFromIP = (ip) => {
  if (ip === '::1' || ip === '127.0.0.1') return 'Localhost';
  return 'Unknown';
};

// Initialize database tables
const initDatabase = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createQRCodesTable = `
    CREATE TABLE IF NOT EXISTS qr_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'url',
      value TEXT NOT NULL,
      qr_src TEXT NOT NULL,
      user_id INTEGER,
      scan_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  const createScanAnalyticsTable = `
    CREATE TABLE IF NOT EXISTS scan_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      qr_id INTEGER NOT NULL,
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip TEXT,
      user_agent TEXT,
      country TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      referer TEXT,
      FOREIGN KEY (qr_id) REFERENCES qr_codes (id) ON DELETE CASCADE
    )
  `;

  try {
    await runQuery(createUsersTable);
    await runQuery(createQRCodesTable);
    await runQuery(createScanAnalyticsTable);
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

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

  // QR Code operations
  getAll: async (userId) => {
    return await allQuery(
      `SELECT id, slug, name, type, value, qr_src, scan_count, 
              created_at, updated_at 
       FROM qr_codes WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
  },

  getById: async (id, userId) => {
    return await getQuery(
      `SELECT id, slug, name, type, value, qr_src, scan_count,
              created_at, updated_at 
       FROM qr_codes WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  },

  getBySlug: async (slug) => {
    return await getQuery(
      `SELECT id, slug, name, type, value, scan_count 
       FROM qr_codes WHERE slug = ?`,
      [slug]
    );
  },

  create: async (qrData, userId) => {
    const { name, type, value, qrSrc } = qrData;
    const slug = generateSlug();
    const result = await runQuery(
      "INSERT INTO qr_codes (slug, name, type, value, qr_src, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [slug, name, type || 'url', value, qrSrc, userId]
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
    if (updates.value) {
      fields.push("value = ?");
      values.push(updates.value);
    }
    if (updates.type) {
      fields.push("type = ?");
      values.push(updates.type);
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
    // First delete analytics
    await runQuery("DELETE FROM scan_analytics WHERE qr_id = ?", [id]);
    await runQuery("DELETE FROM qr_codes WHERE id = ? AND user_id = ?", [id, userId]);
    return true;
  },

  incrementScanCount: async (id) => {
    await runQuery(
      "UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = ?",
      [id]
    );
  },

  // Analytics operations
addScanAnalytics: async (qrId, req) => {
  try {
    // Simple IP detection
    const ip = req.headers['x-forwarded-for'] || 
               req.socket?.remoteAddress || 
               req.connection?.remoteAddress || 
               'unknown';
    
    const userAgent = req.headers['user-agent'] || '';
    
    console.log(`📊 Recording analytics for QR ${qrId} from IP ${ip}`);
    
    // Simple insert without complex parsing first
    const result = await runQuery(
      `INSERT INTO scan_analytics (qr_id, ip, user_agent, scanned_at) 
       VALUES (?, ?, ?, datetime('now'))`,
      [qrId, ip, userAgent]
    );
    
    console.log(`✅ Analytics recorded successfully`);
    return result;
  } catch (error) {
    console.error("❌ Failed to record analytics:", error);
    // Don't throw - we don't want to break the redirect
    return null;
  }
},
  getAnalyticsByQRId: async (qrId, userId) => {
    // First verify ownership
    const qr = await dbOperations.getById(qrId, userId);
    if (!qr) return null;

    const scans = await allQuery(
      `SELECT scanned_at, ip, country, device_type, browser, os, referer 
       FROM scan_analytics WHERE qr_id = ? ORDER BY scanned_at DESC`,
      [qrId]
    );

    const stats = await getQuery(
      `SELECT 
         COUNT(*) as total_scans,
         COUNT(DISTINCT ip) as unique_visitors,
         COUNT(DISTINCT country) as countries
       FROM scan_analytics WHERE qr_id = ?`,
      [qrId]
    );

    const lastScan = await getQuery(
      `SELECT scanned_at FROM scan_analytics WHERE qr_id = ? 
       ORDER BY scanned_at DESC LIMIT 1`,
      [qrId]
    );

    const scansByDay = await allQuery(
      `SELECT DATE(scanned_at) as date, COUNT(*) as count 
       FROM scan_analytics WHERE qr_id = ? 
       GROUP BY DATE(scanned_at) ORDER BY date DESC LIMIT 30`,
      [qrId]
    );

    return {
      total_scans: stats?.total_scans || 0,
      unique_visitors: stats?.unique_visitors || 0,
      countries: stats?.countries || 0,
      last_scan: lastScan?.scanned_at || null,
      scans_by_day: scansByDay,
      recent_scans: scans.slice(0, 50)
    };
  }
};

export { db, initDatabase, dbOperations };