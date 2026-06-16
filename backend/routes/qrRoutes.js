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

    // Get the base URL from environment or use the request origin
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    // Store the redirect URL in the QR code
    const redirectUrl = `${baseUrl}/r/{{SLUG}}`; // This will be replaced with actual slug later

    // Generate QR code image with the redirect URL
    const qrSrc = await QRCode.toDataURL(content, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    const newQRCode = await dbOperations.create(
      { name, type: type || 'url', value, qrSrc },
      req.userId
    );
    
    // Update the QR code with the correct redirect URL
    // The slug is generated in dbOperations.create
    const fullRedirectUrl = `${baseUrl}/r/${newQRCode.slug}`;
    await dbOperations.update(newQRCode.id, req.userId, { value: fullRedirectUrl });

    // Regenerate QR with the full redirect URL
    const newQrSrc = await QRCode.toDataURL(fullRedirectUrl, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
    await dbOperations.update(newQRCode.id, req.userId, { qrSrc: newQrSrc });

    // Get the updated QR code
    const updatedQR = await dbOperations.getById(newQRCode.id, req.userId);
    res.status(201).json(updatedQR);
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
    if (type) updates.type = type;
    
    // Get the existing QR code to get its slug
    const existingQR = await dbOperations.getById(req.params.id, req.userId);
    if (!existingQR) {
      return res.status(404).json({ error: "QR code not found" });
    }

    // If value is provided, update the redirect URL
    if (value) {
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const fullRedirectUrl = `${baseUrl}/r/${existingQR.slug}`;
      updates.value = fullRedirectUrl;
      
      // Generate new QR code with the redirect URL
      updates.qrSrc = await QRCode.toDataURL(fullRedirectUrl, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
    } else if (type === 'wifi') {
      // For WiFi, generate content differently
      let content;
      if (type === 'wifi') {
        content = generateQRContent(type, value || existingQR.value, { encryption: wifiEncryption, password: wifiPassword });
      } else {
        content = generateQRContent(type || 'url', value || existingQR.value);
      }
      updates.qrSrc = await QRCode.toDataURL(content, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
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