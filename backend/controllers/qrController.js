import QRCode from "qrcode";
import { dbOperations } from "../database/database.js";

// Generate QR code data URL
const generateQRCode = async (url) => {
  try {
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    console.error("QR generation error:", error);
    throw new Error("QR generation failed");
  }
};

// Get all QR codes
export const getAllQRCodes = async (req, res) => {
  try {
    const qrCodes = await dbOperations.getAll();
    res.json(qrCodes);
  } catch (error) {
    console.error("Get all error:", error);
    res.status(500).json({ error: "Failed to fetch QR codes" });
  }
};

// Get single QR code
export const getQRCodeById = async (req, res) => {
  try {
    const qrCode = await dbOperations.getById(parseInt(req.params.id));
    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }
    res.json(qrCode);
  } catch (error) {
    console.error("Get by id error:", error);
    res.status(500).json({ error: "Failed to fetch QR code" });
  }
};

// Create new QR code
export const createQRCode = async (req, res) => {
  try {
    const { name, url } = req.body;

    console.log("Creating QR code for:", { name, url });

    // Generate QR code
    const qrSrc = await generateQRCode(url);

    // Save to database
    const newQRCode = await dbOperations.create({
      name: name.trim(),
      url,
      qrSrc,
    });

    console.log("QR code created successfully:", newQRCode);
    res.status(201).json(newQRCode);
  } catch (error) {
    console.error("Creation error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create QR code" });
  }
};

// Update QR code
export const updateQRCode = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, url } = req.body;

    const existingQR = await dbOperations.getById(id);
    if (!existingQR) {
      return res.status(404).json({ error: "QR code not found" });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (url) {
      updates.url = url;
      updates.qrSrc = await generateQRCode(url);
    }

    const updatedQR = await dbOperations.update(id, updates);
    res.json(updatedQR);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update QR code" });
  }
};

// Delete QR code
export const deleteQRCode = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingQR = await dbOperations.getById(id);

    if (!existingQR) {
      return res.status(404).json({ error: "QR code not found" });
    }

    await dbOperations.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete QR code" });
  }
};
