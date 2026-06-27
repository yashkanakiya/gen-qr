// database/database.js
import pkg from "pg";
const { Pool } = pkg;
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PostgreSQL connection pool local
// const pool = new Pool({
//   host: process.env.DB_HOST || "localhost",
//   port: process.env.DB_PORT || 5432,
//   user: process.env.DB_USER || "postgres",
//   password: process.env.DB_PASSWORD || "yourpassword",
//   database: process.env.DB_NAME || "qr_scanner",
//   max: 20,
//   idleTimeoutMillis: 30000,
// });

// PostgreSQL connection pool for production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper to generate unique slug
const generateSlug = () => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

// Initialize database tables
const initDatabase = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createQRCodesTable = `
    CREATE TABLE IF NOT EXISTS qr_codes (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'url',
      value TEXT NOT NULL,
      qr_src TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      scan_count INTEGER DEFAULT 0,
      metadata JSONB,  -- NEW: store extra fields for complex types
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createScanAnalyticsTable = `
    CREATE TABLE IF NOT EXISTS scan_analytics (
      id SERIAL PRIMARY KEY,
      qr_id INTEGER REFERENCES qr_codes(id) ON DELETE CASCADE,
      scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip TEXT,
      user_agent TEXT,
      country TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      referer TEXT
    )
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_scan_analytics_qr_ip_time 
    ON scan_analytics (qr_id, ip, scanned_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_scan_analytics_qr_id 
    ON scan_analytics (qr_id);
    
    CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id 
    ON qr_codes (user_id);
  `;

  // Add metadata column if not exists (for existing databases)
  const addMetadataColumn = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='qr_codes' AND column_name='metadata') THEN
        ALTER TABLE qr_codes ADD COLUMN metadata JSONB;
      END IF;
    END $$;
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createQRCodesTable);
    await pool.query(createScanAnalyticsTable);
    await pool.query(createIndexes);
    await pool.query(addMetadataColumn);
    console.log("✅ PostgreSQL database initialized");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

const dbOperations = {
  // ----- Users -----
  createUser: async (userData) => {
    const { username, email, password, avatar = null } = userData;
    const result = await pool.query(
      `INSERT INTO users (username, email, password, avatar) 
     VALUES ($1, $2, $3, $4) RETURNING id, username, email, avatar, created_at`,
      [username, email, password, avatar],
    );
    return result.rows[0];
  },

  getUserByEmail: async (email) => {
    const result = await pool.query(
      `SELECT id, username, email, password, avatar, created_at FROM users WHERE email = $1`,
      [email],
    );
    return result.rows[0];
  },

  getUserById: async (id) => {
    const result = await pool.query(
      `SELECT id, username, email, avatar, created_at FROM users WHERE id = $1`,
      [id],
    );
    return result.rows[0];
  },

  updateUserProfile: async (userId, updates) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    if (updates.avatar !== undefined) {
      fields.push(`avatar = $${paramIndex++}`);
      values.push(updates.avatar);
    }

    if (fields.length === 0) return null;

    values.push(userId);
    await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
      values,
    );

    return await dbOperations.getUserById(userId);
  },

  // ----- QR Codes -----
  getAll: async (userId) => {
    const result = await pool.query(
      `SELECT id, slug, name, type, value, qr_src, scan_count, metadata, created_at, updated_at 
       FROM qr_codes WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows;
  },

  getById: async (id, userId) => {
    const result = await pool.query(
      `SELECT id, slug, name, type, value, qr_src, scan_count, metadata, created_at, updated_at 
       FROM qr_codes WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return result.rows[0];
  },

  getBySlug: async (slug) => {
    const result = await pool.query(
      `SELECT id, slug, name, type, value, scan_count 
       FROM qr_codes WHERE slug = $1`,
      [slug],
    );
    return result.rows[0];
  },

  create: async (qrData, userId) => {
    const {
      name,
      type,
      value,
      qrSrc,
      slug: customSlug,
      metadata = {},
    } = qrData;
    const slug = customSlug || generateSlug();
    const result = await pool.query(
      `INSERT INTO qr_codes (slug, name, type, value, qr_src, user_id, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, slug, name, type, value, qr_src, scan_count, metadata, created_at, updated_at`,
      [slug, name, type || "url", value, qrSrc, userId, metadata],
    );
    return result.rows[0];
  },

  update: async (id, userId, updates) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.value !== undefined) {
      fields.push(`value = $${paramIndex++}`);
      values.push(updates.value);
    }
    if (updates.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(updates.type);
    }
    if (updates.qrSrc !== undefined) {
      fields.push(`qr_src = $${paramIndex++}`);
      values.push(updates.qrSrc);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(updates.metadata);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    await pool.query(
      `UPDATE qr_codes SET ${fields.join(", ")} 
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
      values,
    );

    return await dbOperations.getById(id, userId);
  },

  delete: async (id, userId) => {
    await pool.query(`DELETE FROM scan_analytics WHERE qr_id = $1`, [id]);
    await pool.query(`DELETE FROM qr_codes WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    return true;
  },

  incrementScanCount: async (id) => {
    await pool.query(
      `UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1`,
      [id],
    );
  },

  // ----- Analytics -----
  addScanAnalytics: async (qrId, req) => {
    try {
      const ip =
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        "unknown";
      const userAgent = req.headers["user-agent"] || "";

      const result = await pool.query(
        `INSERT INTO scan_analytics (qr_id, ip, user_agent, scanned_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id`,
        [qrId, ip, userAgent],
      );
      return result.rows[0];
    } catch (error) {
      console.error("❌ Failed to record analytics:", error);
      return null;
    }
  },

  getAnalyticsByQRId: async (qrId, userId) => {
    const qr = await dbOperations.getById(qrId, userId);
    if (!qr) return null;

    const scans = await pool.query(
      `SELECT scanned_at, ip, country, device_type, browser, os, referer 
       FROM scan_analytics WHERE qr_id = $1 ORDER BY scanned_at DESC`,
      [qrId],
    );

    const stats = await pool.query(
      `SELECT 
         COUNT(*) as total_scans,
         COUNT(DISTINCT ip) as unique_visitors,
         COUNT(DISTINCT country) as countries
       FROM scan_analytics WHERE qr_id = $1`,
      [qrId],
    );

    const lastScan = await pool.query(
      `SELECT scanned_at FROM scan_analytics WHERE qr_id = $1 
       ORDER BY scanned_at DESC LIMIT 1`,
      [qrId],
    );

    const scansByDay = await pool.query(
      `SELECT DATE(scanned_at) as date, COUNT(*) as count 
       FROM scan_analytics WHERE qr_id = $1 
       GROUP BY DATE(scanned_at) ORDER BY date DESC LIMIT 30`,
      [qrId],
    );

    const s = stats.rows[0] || {
      total_scans: 0,
      unique_visitors: 0,
      countries: 0,
    };
    return {
      total_scans: parseInt(s.total_scans) || 0,
      unique_visitors: parseInt(s.unique_visitors) || 0,
      countries: parseInt(s.countries) || 0,
      last_scan: lastScan.rows[0]?.scanned_at || null,
      scans_by_day: scansByDay.rows,
      recent_scans: scans.rows.slice(0, 50),
    };
  },
};

export { pool as db, initDatabase, dbOperations, generateSlug };
