// routes/qrRoutes.js
import express from "express";
import { dbOperations } from "../database/database.js";
import { authenticate } from "../middleware/auth.js";
import QRCode from "qrcode";
import { generateQRContent } from "../utils/qrContentGenerator.js";

const router = express.Router();

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