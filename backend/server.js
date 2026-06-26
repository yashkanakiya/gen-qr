// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import qrRoutes from "./routes/qrRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { initDatabase } from "./database/database.js";
import { dbOperations } from "./database/database.js";
import { db } from "./database/database.js";
import { generateQRContent } from "./utils/qrContentGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
// Middleware
// app.use(cors({
//   origin: [
//       'http://localhost:5173',
//       'http://localhost:3000',
//       'https://gen-qr-five.vercel.app',
//     process.env.FRONTEND_URL
//   ].filter(Boolean),
//   credentials: true
// }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// =============================================
// FILE UPLOAD SETUP
// =============================================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "pdf-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// Upload endpoint
app.post(
  "/api/upload",
  upload.single("pdf"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded or invalid format" });
    }
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, fileName: req.file.originalname });
  },
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "FILE_TOO_LARGE") {
        return res.status(400).json({ error: "File too large (max 5MB)" });
      }
      return res.status(400).json({ error: error.message });
    }
    next(error);
  },
);

// =============================================
// ANALYTICS TRACKING (unchanged)
// =============================================
const parseUserAgent = (userAgent) => {
  const ua = userAgent || "";
  let deviceType = "Unknown";
  let browser = "Unknown";
  let os = "Unknown";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (
    ua.includes("iOS") ||
    ua.includes("iPhone") ||
    ua.includes("iPad") ||
    ua.includes("iPod")
  )
    os = "iOS";
  else if (ua.includes("CrOS")) os = "ChromeOS";

  if (ua.includes("iPhone") || ua.includes("iPod")) deviceType = "Mobile";
  else if (ua.includes("iPad")) deviceType = "Tablet";
  else if (ua.includes("Android") && ua.includes("Mobile"))
    deviceType = "Mobile";
  else if (ua.includes("Android") && !ua.includes("Mobile"))
    deviceType = "Tablet";
  else if (
    ua.includes("Windows") &&
    (ua.includes("Phone") || ua.includes("Mobile"))
  )
    deviceType = "Mobile";
  else if (
    ua.includes("Mac OS") ||
    ua.includes("Windows") ||
    ua.includes("Linux")
  )
    deviceType = "Desktop";

  if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR"))
    browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (
    ua.includes("Safari") &&
    !ua.includes("Chrome") &&
    !ua.includes("Edg") &&
    !ua.includes("OPR")
  )
    browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Brave")) browser = "Brave";

  return { deviceType, browser, os };
};

const getCountryFromIP = async (ip) => {
  if (ip === "::1" || ip === "127.0.0.1" || ip === "localhost")
    return "Localhost";
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
    const data = await response.json();
    return data.country || "Unknown";
  } catch {
    return "Unknown";
  }
};

app.get("/api/track/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const qrCode = await dbOperations.getBySlug(slug);
    if (!qrCode) return res.status(404).json({ error: "QR code not found" });

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["cf-connecting-ip"] ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "";
    const referer = req.headers.referer || req.headers.referrer || "";

    const recentScan = await db.query(
      `SELECT id FROM scan_analytics 
       WHERE qr_id = $1 AND ip = $2 AND scanned_at > NOW() - INTERVAL '5 seconds'`,
      [qrCode.id, ip],
    );

    if (recentScan.rows.length === 0) {
      const { deviceType, browser, os } = parseUserAgent(userAgent);
      const country = await getCountryFromIP(ip);
      await db.query(
        `INSERT INTO scan_analytics 
         (qr_id, ip, user_agent, country, device_type, browser, os, referer, scanned_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [qrCode.id, ip, userAgent, country, deviceType, browser, os, referer],
      );
      await db.query(
        `UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1`,
        [qrCode.id],
      );
    }
    res.json({ success: true, type: qrCode.type, value: qrCode.value });
  } catch (error) {
    console.error("Track error:", error);
    res.status(500).json({ error: "Failed to track scan" });
  }
});

app.get("/r/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const qrCode = await dbOperations.getBySlug(slug);
    if (!qrCode) {
      return res
        .status(404)
        .send(
          `<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>QR Code Not Found</h1></body></html>`,
        );
    }

    // Track scan
    try {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.headers["cf-connecting-ip"] ||
        req.headers["x-real-ip"] ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        "unknown";
      const userAgent = req.headers["user-agent"] || "";
      const referer = req.headers.referer || req.headers.referrer || "";

      const recentScan = await db.query(
        `SELECT id FROM scan_analytics 
         WHERE qr_id = $1 AND ip = $2 AND scanned_at > NOW() - INTERVAL '5 seconds'`,
        [qrCode.id, ip],
      );
      if (recentScan.rows.length === 0) {
        const { deviceType, browser, os } = parseUserAgent(userAgent);
        const country = await getCountryFromIP(ip);
        await db.query(
          `INSERT INTO scan_analytics 
           (qr_id, ip, user_agent, country, device_type, browser, os, referer, scanned_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
          [qrCode.id, ip, userAgent, country, deviceType, browser, os, referer],
        );
        await db.query(
          `UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1`,
          [qrCode.id],
        );
      }
    } catch (trackError) {
      console.error("Tracking error:", trackError);
    }

    // Redirect or show landing page
    if (qrCode.type === "url") {
      return res.redirect(302, qrCode.value);
    }

    res.send(`<!DOCTYPE html>
    <html><head><title>${qrCode.name}</title>
    <style>body{font-family:sans-serif;text-align:center;padding:40px;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}.card{background:white;border-radius:20px;padding:40px;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}h1{margin-top:0}.btn{background:#667eea;color:white;border:none;padding:12px 30px;border-radius:10px;font-size:16px;cursor:pointer;transition:transform .2s}.btn:hover{transform:scale(1.05)}</style>
    </head><body>
    <div class="card"><h1>${qrCode.name}</h1><p>${qrCode.value}</p><button class="btn" onclick="window.location.href='${qrCode.value}'">Continue</button></div>
    </body></html>`);
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).send("Error");
  }
});

app.get("/api/debug/scan/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const qrCode = await dbOperations.getBySlug(slug);
    if (!qrCode) return res.status(404).json({ error: "QR not found" });
    const scans = await db.query(
      `SELECT * FROM scan_analytics WHERE qr_id = $1 ORDER BY scanned_at DESC LIMIT 10`,
      [qrCode.id],
    );
    res.json({
      qr: qrCode,
      scan_count: qrCode.scan_count,
      recent_scans: scans.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// PROTECTED ROUTES
// =============================================
app.use("/api/auth", authRoutes);
app.use("/api/qrcodes", qrRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(
        `📱 Test scan URL: http://localhost:${PORT}/r/YOUR_SLUG_HERE`,
      );
      console.log(`🔐 API: http://localhost:${PORT}/api/qrcodes`);
      console.log(
        `🔍 Debug: http://localhost:${PORT}/api/debug/scan/YOUR_SLUG_HERE\n`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
