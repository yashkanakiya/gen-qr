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
  origin: 'http://localhost:5173',
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

  // Detect device type
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    deviceType = 'Mobile';
  } else if (ua.includes('iPad') || ua.includes('Tablet')) {
    deviceType = 'Tablet';
  } else {
    deviceType = 'Desktop';
  }

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { deviceType, browser, os };
};

// Helper to get country from IP
const getCountryFromIP = (ip) => {
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return 'Localhost';
  }
  return 'Unknown';
};

// =============================================
// PUBLIC REDIRECT ROUTE - NO AUTH REQUIRED
// =============================================
app.get("/r/:slug", async (req, res) => {
  const { slug } = req.params;
  console.log("🔍 Scan received for slug:", slug);
  
  try {
    const qrCode = await dbOperations.getBySlug(slug);
    
    if (!qrCode) {
      console.log("❌ QR Code not found:", slug);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code Not Found</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">QR Code Not Found</h1>
          <p>The QR code "${slug}" doesn't exist.</p>
        </body>
        </html>
      `);
    }
    
    console.log(`✅ Found QR: ${qrCode.name} (ID: ${qrCode.id})`);
    
    // Record analytics with full data
    try {
  // ... after finding qrCode
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.socket?.remoteAddress || 
             req.connection?.remoteAddress || 
             'unknown';
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers.referer || req.headers.referrer || '';
  const { deviceType, browser, os } = parseUserAgent(userAgent);
  const country = getCountryFromIP(ip);

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
  
  console.log(`✅ Scan recorded - Device: ${deviceType}, Browser: ${browser}, OS: ${os}, Country: ${country}`);
} catch (analyticsError) {
  console.error("Analytics error:", analyticsError);
}
    
    // Generate content and redirect
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
          body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .card { background: white; border-radius: 10px; padding: 30px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          button { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; }
          button:hover { background: #45a049; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${qrCode.name}</h1>
          <p><strong>Type:</strong> ${qrCode.type}</p>
          <p><strong>Value:</strong> ${qrCode.value}</p>
          <button onclick="window.location.href='${content}'">Continue</button>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error("❌ Redirect error:", error);
    res.status(500).send("Internal server error");
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
    app.listen(PORT, () => {
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