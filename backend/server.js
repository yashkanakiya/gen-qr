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

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
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

  // Detect OS first (order matters!)
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS';
  else if (ua.includes('CrOS')) os = 'ChromeOS';

  // Detect device type
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

  // Detect browser
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

// =============================================
// PUBLIC REDIRECT ROUTE - NO AUTH REQUIRED
// =============================================
app.get("/r/:slug", async (req, res) => {
  const { slug } = req.params;
  console.log(`🔍 Scan received for slug: ${slug}`);

  try {
    const qrCode = await dbOperations.getBySlug(slug);

    if (!qrCode) {
      console.log(`❌ QR Code not found: ${slug}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .error { color: red; }
            .card { background: white; border-radius: 10px; padding: 30px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="error">QR Code Not Found</h1>
            <p>The QR code "${slug}" doesn't exist.</p>
            <a href="/">Go Home</a>
          </div>
        </body>
        </html>
      `);
    }

    console.log(`✅ Found QR: ${qrCode.name} (ID: ${qrCode.id})`);

    // Get client info
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.socket?.remoteAddress || 
               req.connection?.remoteAddress || 
               'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers.referer || req.headers.referrer || '';

    // =============================================
    // DUPLICATE DETECTION - PREVENT MULTIPLE SCANS
    // =============================================
    try {
      // Check if this IP has scanned this QR code recently (within last 30 seconds)
      const recentScan = await db.query(
        `SELECT id, scanned_at FROM scan_analytics 
         WHERE qr_id = $1 AND ip = $2 AND scanned_at > NOW() - INTERVAL '30 seconds'
         ORDER BY scanned_at DESC LIMIT 1`,
        [qrCode.id, ip]
      );

      if (recentScan.rows.length > 0) {
        console.log(`⏭️ Duplicate scan detected for IP ${ip} (${recentScan.rows[0].scanned_at})`);
        // Still redirect, but don't record duplicate analytics
        const content = generateQRContent(qrCode.type, qrCode.value);
        if (qrCode.type === 'url') {
          return res.redirect(301, content);
        }
        // ... handle non-URL redirects
        return res.redirect(301, content);
      }
    } catch (duplicateCheckError) {
      console.error("Duplicate check error:", duplicateCheckError);
      // Continue with analytics recording if duplicate check fails
    }

    // =============================================
    // RECORD ANALYTICS (Only if not duplicate)
    // =============================================
    try {
      const { deviceType, browser, os } = parseUserAgent(userAgent);
      const country = await getCountryFromIP(ip);

      // Insert scan record
      await db.query(
        `INSERT INTO scan_analytics 
         (qr_id, ip, user_agent, country, device_type, browser, os, referer, scanned_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [qrCode.id, ip, userAgent, country, deviceType, browser, os, referer]
      );

      // Increment scan count (only once)
      await db.query(
        `UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1`,
        [qrCode.id]
      );

      console.log(`✅ Scan recorded - Device: ${deviceType}, Browser: ${browser}, OS: ${os}, Country: ${country}`);
    } catch (analyticsError) {
      console.error("❌ Analytics error:", analyticsError);
      // Continue with redirect even if analytics fails
    }

    // =============================================
    // REDIRECT
    // =============================================
    const content = generateQRContent(qrCode.type, qrCode.value);

    if (qrCode.type === 'url') {
      console.log(`🚀 Redirecting to: ${content}`);
      return res.redirect(301, content);
    }

    // For non-URL types, show landing page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${qrCode.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
          .card { background: white; border-radius: 20px; padding: 40px; max-width: 500px; margin: 0 auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
          h1 { margin-top: 0; color: #333; }
          .type-badge { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-bottom: 15px; }
          .value { background: #f5f5f5; padding: 15px; border-radius: 10px; word-break: break-all; margin: 20px 0; }
          .btn { background: #667eea; color: white; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-size: 16px; transition: transform 0.2s; }
          .btn:hover { transform: scale(1.05); }
          .btn:active { transform: scale(0.95); }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${qrCode.name}</h1>
          <div class="type-badge">${qrCode.type}</div>
          <div class="value">${qrCode.value}</div>
          <button class="btn" onclick="window.location.href='${content}'">Continue</button>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error("❌ Redirect error:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .card { background: white; border-radius: 10px; padding: 30px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .error { color: red; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="error">Error</h1>
          <p>Something went wrong. Please try again later.</p>
          <a href="/">Go Home</a>
        </div>
      </body>
      </html>
    `);
  }
});

// =============================================
// PROTECTED ROUTES (require authentication)
// =============================================
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

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📱 Test scan URL: http://localhost:${PORT}/r/YOUR_SLUG_HERE`);
      console.log(`🔐 API: http://localhost:${PORT}/api/qrcodes\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();