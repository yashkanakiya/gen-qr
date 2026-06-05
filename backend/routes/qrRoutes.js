import express from "express";
import {
  getAllQRCodes,
  getQRCodeById,
  createQRCode,
  updateQRCode,
  deleteQRCode,
} from "../controllers/qrController.js";
import { validateQRData } from "../middleware/validation.js";

const router = express.Router();

// Routes
router.get("/", getAllQRCodes);
router.get("/:id", getQRCodeById);
router.post("/", validateQRData, createQRCode);
router.put("/:id", validateQRData, updateQRCode);
router.delete("/:id", deleteQRCode);

export default router;
