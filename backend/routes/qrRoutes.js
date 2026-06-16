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

    // Generate the actual QR content based on type
    let content;
    if (type === 'wifi') {
      content = generateQRContent(type, value, { encryption: wifiEncryption, password: wifiPassword });
    } else {
      content = generateQRContent(type || 'url', value);
    }

    console.log(`📝 Creating QR Code - Type: ${type}, Content: ${content}`);

    // Generate QR code image with the ACTUAL content
    const qrSrc = await QRCode.toDataURL(content, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    // Store the ACTUAL content in the database, NOT a redirect URL
    const newQRCode = await dbOperations.create(
      { 
        name, 
        type: type || 'url', 
        value: content,  // Store the actual content
        qrSrc 
      },
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
    if (type) updates.type = type;
    
    if (value) {
      // Generate the actual QR content based on type
      let content;
      if (type === 'wifi') {
        content = generateQRContent(type, value, { encryption: wifiEncryption, password: wifiPassword });
      } else {
        content = generateQRContent(type || 'url', value);
      }
      
      updates.value = content; // Store the actual content
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