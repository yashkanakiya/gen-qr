import express from "express";
import { dbOperations } from "../database/database.js";
import { authenticate } from "../middleware/auth.js";
import QRCode from "qrcode";

const router = express.Router();

// Apply authentication to all QR routes
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

// Get single QR code
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

// Create new QR code
router.post("/", async (req, res) => {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: "Name and URL are required" });
    }

    // Generate QR code
    const qrSrc = await QRCode.toDataURL(url, {
      width: 500,
      margin: 2,
    });

    const newQRCode = await dbOperations.create(
      { name, url, qrSrc },
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
    const { name, url } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (url) updates.url = url;
    
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