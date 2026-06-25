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
    const analytics = await dbOperations.getAnalyticsByQRId(
      req.params.id,
      req.userId,
    );
    if (!analytics) {
      return res.status(404).json({ error: "QR code not found" });
    }
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      type,
      value,
      wifiEncryption,
      wifiPassword,
      emailSubject,
      emailBody,
      smsMessage,
    } = req.body;

    if (!name || !value) {
      return res.status(400).json({ error: "Name and value are required" });
    }

    // Build extra data for the specific type
    let extraData = {};
    if (type === "wifi") {
      extraData = { encryption: wifiEncryption, password: wifiPassword };
    } else if (type === "email") {
      extraData = { subject: emailSubject, body: emailBody };
    } else if (type === "sms") {
      extraData = { message: smsMessage };
    }

    const content = generateQRContent(type || "url", value, extraData);

    const slug = generateSlug();
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const trackingUrl = `${baseUrl}/r/${slug}`;

    const qrSrc = await QRCode.toDataURL(trackingUrl, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    const newQRCode = await dbOperations.create(
      {
        name,
        type: type || "url",
        value: content,
        qrSrc,
        slug,
      },
      req.userId,
    );

    res.status(201).json(newQRCode);
  } catch (error) {
    console.error("Error creating QR code:", error);
    res.status(500).json({ error: "Failed to create QR code" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      value,
      type,
      wifiEncryption,
      wifiPassword,
      emailSubject,
      emailBody,
      smsMessage,
    } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (type) updates.type = type;

    if (value !== undefined) {
      let extraData = {};
      const finalType = type || "url";
      if (finalType === "wifi") {
        extraData = { encryption: wifiEncryption, password: wifiPassword };
      } else if (finalType === "email") {
        extraData = { subject: emailSubject, body: emailBody };
      } else if (finalType === "sms") {
        extraData = { message: smsMessage };
      }
      updates.value = generateQRContent(finalType, value, extraData);
      // Do NOT update qrSrc – the tracking URL remains the same
    }

    const updatedQRCode = await dbOperations.update(
      req.params.id,
      req.userId,
      updates,
    );
    if (!updatedQRCode)
      return res.status(404).json({ error: "QR code not found" });
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
