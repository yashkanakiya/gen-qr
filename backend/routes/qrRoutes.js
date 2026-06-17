// routes/qrRoutes.js
import express from "express";
import { dbOperations } from "../database/database.js";
import { authenticate } from "../middleware/auth.js";
import QRCode from "qrcode";
import { generateQRContent } from "../utils/qrContentGenerator.js";

const router = express.Router();

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

// ------------------------------------------------
// CREATE QR CODE – Fixed to generate tracking URL
// ------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const { name, type, value, wifiEncryption, wifiPassword } = req.body;
    
    if (!name || !value) {
      return res.status(400).json({ error: "Name and value are required" });
    }

    // Generate the QR content based on type (this is what will be stored as the target)
    let content;
    if (type === 'wifi') {
      content = generateQRContent(type, value, { encryption: wifiEncryption, password: wifiPassword });
    } else {
      content = generateQRContent(type || 'url', value);
    }

    console.log(`📝 Creating QR - Type: ${type}, Content: ${content}`);

    // 1. Insert the record first – generate a placeholder QR (will be replaced)
    const newQRCode = await dbOperations.create(
      { 
        name, 
        type: type || 'url', 
        value: content,         // store the actual target content
        qrSrc: ''              // placeholder, will be updated
      },
      req.userId
    );

    // 2. Build the tracking URL using the slug from the newly created record
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/r/${newQRCode.slug}`;

    console.log(`🔗 Tracking URL: ${trackingUrl}`);

    // 3. Generate QR code from the tracking URL
    const qrSrc = await QRCode.toDataURL(trackingUrl, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    // 4. Update the record with the actual QR image
    const updatedQR = await dbOperations.update(newQRCode.id, req.userId, { qrSrc });

    console.log(`✅ QR Created - Slug: ${newQRCode.slug}, Type: ${newQRCode.type}`);
    res.status(201).json(updatedQR);
  } catch (error) {
    console.error("Error creating QR code:", error);
    res.status(500).json({ error: "Failed to create QR code" });
  }
});

// ------------------------------------------------
// UPDATE QR CODE – Fixed to re‑generate tracking URL
// ------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { name, value, type, wifiEncryption, wifiPassword } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (type) updates.type = type;
    
    // If value or type changes, we need to update the stored content and re‑generate QR
    if (value || type) {
      // Get current QR to access its slug
      const existing = await dbOperations.getById(req.params.id, req.userId);
      if (!existing) {
        return res.status(404).json({ error: "QR code not found" });
      }

      // Generate the new content based on the provided type/value
      const effectiveType = type || existing.type;
      const effectiveValue = value || existing.value;
      let content;
      if (effectiveType === 'wifi') {
        content = generateQRContent(effectiveType, effectiveValue, { encryption: wifiEncryption, password: wifiPassword });
      } else {
        content = generateQRContent(effectiveType, effectiveValue);
      }

      updates.value = content;

      // Re‑generate QR using the same slug
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const trackingUrl = `${baseUrl}/r/${existing.slug}`;
      updates.qrSrc = await QRCode.toDataURL(trackingUrl, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
    }

    // If only name changes, just update the name (no QR regeneration)
    const updatedQRCode = await dbOperations.update(req.params.id, req.userId, updates);
    if (!updatedQRCode) return res.status(404).json({ error: "QR code not found" });
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