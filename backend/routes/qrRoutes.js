// routes/qrRoutes.js
import express from "express";
import { dbOperations, generateSlug } from "../database/database.js";
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

// 🔧 CHANGED: Create new QR code – encode tracking URL in image
router.post("/", async (req, res) => {
  try {
    const { name, type, value, wifiEncryption, wifiPassword } = req.body;
    
    if (!name || !value) {
      return res.status(400).json({ error: "Name and value are required" });
    }

    // 1. Generate the actual content (with scheme, e.g., mailto:, tel:, etc.)
    let content;
    if (type === 'wifi') {
      content = generateQRContent(type, value, { encryption: wifiEncryption, password: wifiPassword });
    } else {
      content = generateQRContent(type || 'url', value);
    }

    // 2. Create a unique slug for this QR code
    const slug = generateSlug();

    // 3. Build the tracking URL using the base URL (fallback to request host)
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const trackingUrl = `${baseUrl}/r/${slug}`;

    console.log(`📝 Creating QR - Type: ${type}, Tracking URL: ${trackingUrl}`);

    // 4. Generate QR code image from the tracking URL
    const qrSrc = await QRCode.toDataURL(trackingUrl, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    // 5. Store the QR code with the tracking image and the actual content
    const newQRCode = await dbOperations.create(
      { 
        name, 
        type: type || 'url', 
        value: content,       // this is what /r/:slug will redirect to
        qrSrc,
        slug                  // pass the pre-generated slug
      },
      req.userId
    );
    
    console.log(`✅ QR Created - Slug: ${newQRCode.slug}, Type: ${newQRCode.type}`);
    res.status(201).json(newQRCode);
  } catch (error) {
    console.error("Error creating QR code:", error);
    res.status(500).json({ error: "Failed to create QR code" });
  }
});

// 🔧 CHANGED: Update QR code – do NOT regenerate QR image
router.put("/:id", async (req, res) => {
  try {
    const { name, value, type, wifiEncryption, wifiPassword } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (type) updates.type = type;
    
    if (value) {
      // Re-generate the actual content (with scheme) for the updated value
      let content;
      if (type === 'wifi') {
        content = generateQRContent(type, value, { encryption: wifiEncryption, password: wifiPassword });
      } else {
        content = generateQRContent(type || 'url', value);
      }
      updates.value = content;
      // Do NOT update qrSrc – the tracking URL remains the same
    }

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