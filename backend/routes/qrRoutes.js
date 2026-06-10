// routes/qrRoutes.js
import express from "express";
import { dbOperations } from "../database/database.js";
import { authenticate } from "../middleware/auth.js";
import QRCode from "qrcode";
import { generateQRContent } from "../utils/qrContentGenerator.js";

const router = express.Router();

// Public redirect endpoint (no auth)
router.get("/r/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`Redirect requested for slug: ${slug}`);
    console.log('Request headers:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer
    });
    
    const qrCode = await dbOperations.getBySlug(slug);
    
    if (!qrCode) {
      console.log(`QR Code not found for slug: ${slug}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code Not Found</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .card { background: white; padding: 2rem; border-radius: 1rem; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            h1 { color: #333; margin-bottom: 0.5rem; }
            p { color: #666; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">🔍</div>
            <h1>QR Code Not Found</h1>
            <p>The QR code you're looking for doesn't exist or has been removed.</p>
          </div>
        </body>
        </html>
      `);
    }

    console.log(`QR Code found: ${qrCode.id} - ${qrCode.name}`);
    
    // Record analytics - wrap in try-catch to ensure redirect still works
    try {
      await dbOperations.addScanAnalytics(qrCode.id, req);
      await dbOperations.incrementScanCount(qrCode.id);
      console.log(`Analytics recorded for QR ${qrCode.id}`);
    } catch (analyticsError) {
      console.error('Analytics recording failed:', analyticsError);
      // Continue with redirect even if analytics fails
    }

    // Generate the actual content
    const content = generateQRContent(qrCode.type, qrCode.value);
    
    // For URLs, redirect; for others, show a landing page
    if (qrCode.type === 'url') {
      console.log(`Redirecting to URL: ${content}`);
      return res.redirect(301, content);
    }

    // For non-URL types, show a nice landing page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${qrCode.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1rem; }
          .card { background: white; border-radius: 1rem; padding: 2rem; max-width: 500px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; }
          .qr-icon { font-size: 3rem; margin-bottom: 1rem; }
          h1 { color: #333; margin-bottom: 0.5rem; font-size: 1.5rem; }
          .content { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; word-break: break-all; }
          .content-label { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }
          .value { font-size: 1rem; color: #333; }
          button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
          button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
          .footer { margin-top: 1rem; font-size: 0.75rem; color: #666; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="qr-icon">📱</div>
          <h1>${escapeHtml(qrCode.name)}</h1>
          <div class="content">
            <div class="content-label">${qrCode.type.toUpperCase()}</div>
            <div class="value">${escapeHtml(qrCode.value)}</div>
          </div>
          <button onclick="handleAction()">${getActionButtonText(qrCode.type)}</button>
          <div class="footer">Powered by QR Code Generator</div>
        </div>
        <script>
          function handleAction() {
            ${getActionScript(qrCode.type, content)}
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .card { background: white; padding: 2rem; border-radius: 1rem; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Something went wrong</h1>
          <p>Please try again later</p>
        </div>
      </body>
      </html>
    `);
  }
});

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function getActionButtonText(type) {
  switch (type) {
    case 'email': return 'Send Email';
    case 'phone': return 'Call Now';
    case 'sms': return 'Send SMS';
    case 'wifi': return 'Connect to WiFi';
    case 'location': return 'Open Maps';
    default: return 'Open';
  }
}

function getActionScript(type, content) {
  switch (type) {
    case 'email':
      return `window.location.href = '${content}';`;
    case 'phone':
      return `window.location.href = '${content}';`;
    case 'sms':
      return `window.location.href = '${content}';`;
    case 'wifi':
      return `alert('WiFi: ${content}\\n\\nNote: On iOS, you need to manually enter WiFi details.\\nOn Android, this may open WiFi settings.');`;
    case 'location':
      return `window.location.href = '${content}';`;
    default:
      return `window.location.href = '${content}';`;
  }
}

// Apply authentication to protected routes
router.use(authenticate);

// Get all QR codes for the authenticated user
router.get("/", async (req, res) => {
  try {
    const qrCodes = await dbOperations.getAll(req.userId);
    res.json(qrCodes);
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    res.status(500).json({ error: "Failed to fetch QR codes" });
  }
});

// Get QR code with analytics
router.get("/:id", async (req, res) => {
  try {
    const qrCode = await dbOperations.getById(req.params.id, req.userId);
    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }
    res.json(qrCode);
  } catch (error) {
    console.error("Error fetching QR code:", error);
    res.status(500).json({ error: "Failed to fetch QR code" });
  }
});

// Get analytics for a QR code
router.get("/:id/analytics", async (req, res) => {
  try {
    const analytics = await dbOperations.getAnalyticsByQRId(req.params.id, req.userId);
    if (!analytics) {
      return res.status(404).json({ error: "QR code not found" });
    }
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Create new QR code
router.post("/", async (req, res) => {
  try {
    const { name, type, value, wifiEncryption, wifiPassword } = req.body;
    
    if (!name || !value) {
      return res.status(400).json({ error: "Name and value are required" });
    }

    // Generate the QR content
    let content;
    if (type === 'wifi') {
      content = generateQRContent(type, value, { encryption: wifiEncryption, password: wifiPassword });
    } else {
      content = generateQRContent(type || 'url', value);
    }

    // Generate QR code image
    const qrSrc = await QRCode.toDataURL(content, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    const newQRCode = await dbOperations.create(
      { name, type: type || 'url', value, qrSrc },
      req.userId
    );
    
    res.status(201).json(newQRCode);
  } catch (error) {
    console.error("Error creating QR code:", error);
    res.status(500).json({ error: "Failed to create QR code" });
  }
});

// Update QR code
router.put("/:id", async (req, res) => {
  try {
    const { name, value, type, wifiEncryption, wifiPassword } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (value) {
      updates.value = value;
      
      // Regenerate QR code
      let content;
      if (type === 'wifi') {
        content = generateQRContent(type, value, { encryption: wifiEncryption, password: wifiPassword });
      } else {
        content = generateQRContent(type || 'url', value);
      }
      
      updates.qrSrc = await QRCode.toDataURL(content, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
    }
    
    const updatedQRCode = await dbOperations.update(
      req.params.id,
      req.userId,
      updates
    );
    
    if (!updatedQRCode) {
      return res.status(404).json({ error: "QR code not found" });
    }
    
    res.json(updatedQRCode);
  } catch (error) {
    console.error("Error updating QR code:", error);
    res.status(500).json({ error: "Failed to update QR code" });
  }
});

// Delete QR code
router.delete("/:id", async (req, res) => {
  try {
    await dbOperations.delete(req.params.id, req.userId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting QR code:", error);
    res.status(500).json({ error: "Failed to delete QR code" });
  }
});

export default router;