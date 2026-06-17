// server.js
import 'dotenv/config';
import express from "express";
import cors from "cors";
import qrRoutes from "./routes/qrRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { initDatabase } from "./database/database.js";
import { dbOperations } from "./database/database.js";
import { db } from "./database/database.js";
import { generateQRContent } from "./utils/qrContentGenerator.js";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://gen-qr-five.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  let deviceType = 'Unknown';
  let browser = 'Unknown';
  let os = 'Unknown';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS';
  else if (ua.includes('CrOS')) os = 'ChromeOS';

  if (ua.includes('iPhone') || ua.includes('iPod')) {
    deviceType = 'Mobile';
  } else if (ua.includes('iPad')) {
    deviceType = 'Tablet';
  } else if (ua.includes('Android') && ua.includes('Mobile')) {
    deviceType = 'Mobile';
  } else if (ua.includes('Android') && !ua.includes('Mobile')) {
    deviceType = 'Tablet';
  } else if (ua.includes('Windows') && (ua.includes('Phone') || ua.includes('Mobile'))) {
    deviceType = 'Mobile';
  } else if (ua.includes('Mac OS') || ua.includes('Windows') || ua.includes('Linux')) {
    deviceType = 'Desktop';
  }

  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    browser = 'Safari';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  } else if (ua.includes('OPR') || ua.includes('Opera')) {
    browser = 'Opera';
  } else if (ua.includes('Brave')) {
    browser = 'Brave';
  }

  return { deviceType, browser, os };
};

// Helper to get country from IP
const getCountryFromIP = async (ip) => {
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return 'Localhost';
  }
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
    const data = await response.json();
    return data.country || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
};

// ============================================================
//  TRACKING ROUTE – only tracks on GET requests
// ============================================================
app.get("/api/track/:slug", async (req, res) => {
  const { slug } = req.params;
  console.log(`📊 Track request for slug: ${slug} (${req.method})`);

  try {
    const qrCode = await dbOperations.getBySlug(slug);
    if (!qrCode) {
      console.log(`❌ QR Code not found: ${slug}`);
      return res.status(404).json({ error: "QR code not found" });
    }

    // Only record analytics for GET requests (ignore HEAD, etc.)
    if (req.method === 'GET') {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                 req.headers['cf-connecting-ip'] ||
                 req.headers['x-real-ip'] ||
                 req.socket?.remoteAddress || 
                 req.connection?.remoteAddress || 
                 'unknown';
      
      const userAgent = req.headers['user-agent'] || '';
      const referer = req.headers.referer || req.headers.referrer || '';

      // Check for duplicate within 30 seconds
      const recentScan = await db.query(
        `SELECT id FROM scan_analytics 
         WHERE qr_id = $1 AND ip = $2 AND scanned_at > NOW() - INTERVAL '30 seconds'`,
        [qrCode.id, ip]
      );

      if (recentScan.rows.length === 0) {
        const { deviceType, browser, os } = parseUserAgent(userAgent);
        const country = await getCountryFromIP(ip);

        await db.query(
          `INSERT INTO scan_analytics 
           (qr_id, ip, user_agent, country, device_type, browser, os, referer, scanned_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
          [qrCode.id, ip, userAgent, country, deviceType, browser, os, referer]
        );

        await db.query(
          `UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1`,
          [qrCode.id]
        );

        console.log(`✅ Scan recorded - IP: ${ip}, Device: ${deviceType}`);
      } else {
        console.log(`⏭️ Duplicate scan detected for IP ${ip} (within 30s)`);
      }
    } else {
      console.log(`⏭️ Skipping tracking for non-GET request (${req.method})`);
    }

    res.json({ 
      success: true, 
      type: qrCode.type, 
      value: qrCode.value 
    });
  } catch (error) {
    console.error("❌ Track error:", error);
    res.status(500).json({ error: "Failed to track scan" });
  }
});

// ============================================================
//  PUBLIC REDIRECT ROUTE – only tracks on GET requests
// ============================================================
app.get("/r/:slug", async (req, res) => {
  // Disable caching to prevent 304 issues
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { slug } = req.params;
  console.log(`🔍 ${req.method} request for slug: ${slug}`);

  try {
    const qrCode = await dbOperations.getBySlug(slug);

    if (!qrCode) {
      console.log(`❌ QR Code not found: ${slug}`);
      return res.status(404).send(`...`); // your 404 HTML
    }

    console.log(`✅ Found QR: ${qrCode.name} (ID: ${qrCode.id})`);
    console.log(`📝 Type: ${qrCode.type}, Content: ${qrCode.value}`);

    // ---- TRACKING: track ALL requests (HEAD, GET, etc.) ----
    try {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                 req.headers['cf-connecting-ip'] ||
                 req.headers['x-real-ip'] ||
                 req.socket?.remoteAddress || 
                 req.connection?.remoteAddress || 
                 'unknown';
      
      const userAgent = req.headers['user-agent'] || '';
      const referer = req.headers.referer || req.headers.referrer || '';

      console.log(`📡 IP: ${ip}, User-Agent: ${userAgent}`);

      // Check for duplicate within 30 seconds
      const recentScan = await db.query(
        `SELECT id FROM scan_analytics 
         WHERE qr_id = $1 AND ip = $2 AND scanned_at > NOW() - INTERVAL '30 seconds'`,
        [qrCode.id, ip]
      );
      console.log(`📊 Recent scans: ${recentScan.rows.length}`);

      if (recentScan.rows.length === 0) {
        const { deviceType, browser, os } = parseUserAgent(userAgent);
        const country = await getCountryFromIP(ip);

        await db.query(
          `INSERT INTO scan_analytics 
           (qr_id, ip, user_agent, country, device_type, browser, os, referer, scanned_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
          [qrCode.id, ip, userAgent, country, deviceType, browser, os, referer]
        );

        await db.query(
          `UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1`,
          [qrCode.id]
        );

        console.log(`✅ Scan recorded - IP: ${ip}, Device: ${deviceType}`);
      } else {
        console.log(`⏭️ Duplicate scan detected for IP ${ip} (within 30s)`);
      }
    } catch (trackError) {
      console.error("❌ Tracking error:", trackError);
      // Continue with redirect even if tracking fails
    }

    // ---- Redirect or show landing page ----
    const content = qrCode.value;
    
    if (qrCode.type === 'url') {
      console.log(`🚀 Redirecting to: ${content}`);
      return res.redirect(302, content);
    }

    // For non-URL types, show landing page with action button
    res.send(`...`); // your landing page HTML

  } catch (error) {
    console.error("❌ Redirect error:", error);
    res.status(500).send(`...`); // your error HTML
  }
});

// ============================================================
//  DEBUG ROUTE (optional)
// ============================================================
app.get("/api/debug/scan/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const qrCode = await dbOperations.getBySlug(slug);
    if (!qrCode) {
      return res.status(404).json({ error: "QR not found" });
    }
    
    const scans = await db.query(
      `SELECT * FROM scan_analytics WHERE qr_id = $1 ORDER BY scanned_at DESC LIMIT 10`,
      [qrCode.id]
    );
    
    res.json({
      qr: qrCode,
      scan_count: qrCode.scan_count,
      recent_scans: scans.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
//  PROTECTED ROUTES
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/qrcodes", qrRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ============================================================
//  START SERVER
// ============================================================
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📱 Test scan URL: http://localhost:${PORT}/r/YOUR_SLUG_HERE`);
      console.log(`🔐 API: http://localhost:${PORT}/api/qrcodes`);
      console.log(`🔍 Debug: http://localhost:${PORT}/api/debug/scan/YOUR_SLUG_HERE\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();