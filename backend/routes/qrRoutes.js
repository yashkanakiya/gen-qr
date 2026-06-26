// routes/qrRoutes.js
import express from "express";
import { dbOperations, generateSlug } from "../database/database.js";
import { authenticate } from "../middleware/auth.js";
import QRCode from "qrcode";
import { generateQRContent } from "../utils/qrContentGenerator.js";

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const qrCodes = await dbOperations.getAll(req.userId);
    res.json(qrCodes);
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    res.status(500).json({ error: "Failed to fetch QR codes" });
  }
});

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
      // New fields for PDF, Event, VCard
      pdfUrl,
      pdfFileName,
      eventTitle,
      eventStartDate,
      eventStartTime,
      eventEndDate,
      eventEndTime,
      eventLocation,
      eventDescription,
      eventUrl,
      vcardFirstName,
      vcardLastName,
      vcardPhone,
      vcardEmail,
      vcardCompany,
      vcardJobTitle,
      vcardAddress,
      vcardWebsite,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    let finalValue = value || "";
    let metadata = {};

    const finalType = type || "url";

    let extraData = {};
    switch (finalType) {
      case "url":
      case "text":
        if (!value) return res.status(400).json({ error: "Value is required" });
        finalValue = value;
        break;

      case "email":
        if (!value) return res.status(400).json({ error: "Email is required" });
        extraData = { subject: emailSubject, body: emailBody };
        metadata = { emailSubject, emailBody };
        break;

      case "phone":
        if (!value) return res.status(400).json({ error: "Phone is required" });
        break;

      case "sms":
        if (!value) return res.status(400).json({ error: "Phone is required" });
        extraData = { message: smsMessage };
        metadata = { smsMessage };
        break;

      case "wifi":
        if (!value) return res.status(400).json({ error: "SSID is required" });
        extraData = { encryption: wifiEncryption, password: wifiPassword };
        metadata = { wifiEncryption, wifiPassword };
        break;

      case "location":
        if (!value)
          return res.status(400).json({ error: "Location is required" });
        break;

      case "pdf":
        if (!pdfUrl)
          return res.status(400).json({ error: "PDF URL is required" });
        finalValue = pdfUrl;
        metadata = { pdfUrl, pdfFileName: pdfFileName || "" };
        break;

      case "event":
        if (
          !eventTitle ||
          !eventStartDate ||
          !eventStartTime ||
          !eventEndDate ||
          !eventEndTime
        ) {
          return res
            .status(400)
            .json({ error: "Event title, start & end date/time are required" });
        }
        extraData = {
          title: eventTitle,
          startDate: eventStartDate,
          startTime: eventStartTime,
          endDate: eventEndDate,
          endTime: eventEndTime,
          location: eventLocation,
          description: eventDescription,
          url: eventUrl,
        };
        metadata = {
          eventTitle,
          eventStartDate,
          eventStartTime,
          eventEndDate,
          eventEndTime,
          eventLocation,
          eventDescription,
          eventUrl,
        };
        finalValue = "event";
        break;

      case "vcard":
        if (!vcardFirstName) {
          return res.status(400).json({ error: "First name is required" });
        }
        extraData = {
          firstName: vcardFirstName,
          lastName: vcardLastName || "",
          phone: vcardPhone,
          email: vcardEmail,
          company: vcardCompany,
          jobTitle: vcardJobTitle,
          address: vcardAddress,
          website: vcardWebsite,
        };
        metadata = {
          vcardFirstName,
          vcardLastName,
          vcardPhone,
          vcardEmail,
          vcardCompany,
          vcardJobTitle,
          vcardAddress,
          vcardWebsite,
        };
        finalValue = "vcard";
        break;

      default:
        return res.status(400).json({ error: "Unsupported QR type" });
    }

    const content = generateQRContent(finalType, finalValue, extraData);

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
        type: finalType,
        value: content,
        qrSrc,
        slug,
        metadata,
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
      pdfUrl,
      pdfFileName,
      eventTitle,
      eventStartDate,
      eventStartTime,
      eventEndDate,
      eventEndTime,
      eventLocation,
      eventDescription,
      eventUrl,
      vcardFirstName,
      vcardLastName,
      vcardPhone,
      vcardEmail,
      vcardCompany,
      vcardJobTitle,
      vcardAddress,
      vcardWebsite,
    } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (type) updates.type = type;

    // If value or type is being updated, recompute content and metadata
    if (value !== undefined || type) {
      const finalType =
        type ||
        (await dbOperations.getById(req.params.id, req.userId))?.type ||
        "url";
      let finalValue = value || "";
      let extraData = {};
      let metadata = {};

      switch (finalType) {
        case "url":
        case "text":
          if (!value)
            return res.status(400).json({ error: "Value is required" });
          finalValue = value;
          break;

        case "email":
          if (!value)
            return res.status(400).json({ error: "Email is required" });
          extraData = { subject: emailSubject, body: emailBody };
          metadata = { emailSubject, emailBody };
          break;

        case "phone":
          if (!value)
            return res.status(400).json({ error: "Phone is required" });
          break;

        case "sms":
          if (!value)
            return res.status(400).json({ error: "Phone is required" });
          extraData = { message: smsMessage };
          metadata = { smsMessage };
          break;

        case "wifi":
          if (!value)
            return res.status(400).json({ error: "SSID is required" });
          extraData = { encryption: wifiEncryption, password: wifiPassword };
          metadata = { wifiEncryption, wifiPassword };
          break;

        case "location":
          if (!value)
            return res.status(400).json({ error: "Location is required" });
          break;

        case "pdf":
          if (!pdfUrl)
            return res.status(400).json({ error: "PDF URL is required" });
          finalValue = pdfUrl;
          metadata = { pdfUrl, pdfFileName: pdfFileName || "" };
          break;

        case "event":
          if (
            !eventTitle ||
            !eventStartDate ||
            !eventStartTime ||
            !eventEndDate ||
            !eventEndTime
          ) {
            return res
              .status(400)
              .json({
                error: "Event title, start & end date/time are required",
              });
          }
          extraData = {
            title: eventTitle,
            startDate: eventStartDate,
            startTime: eventStartTime,
            endDate: eventEndDate,
            endTime: eventEndTime,
            location: eventLocation,
            description: eventDescription,
            url: eventUrl,
          };
          metadata = {
            eventTitle,
            eventStartDate,
            eventStartTime,
            eventEndDate,
            eventEndTime,
            eventLocation,
            eventDescription,
            eventUrl,
          };
          finalValue = "event";
          break;

        case "vcard":
          if (!vcardFirstName) {
            return res.status(400).json({ error: "First name is required" });
          }
          extraData = {
            firstName: vcardFirstName,
            lastName: vcardLastName || "",
            phone: vcardPhone,
            email: vcardEmail,
            company: vcardCompany,
            jobTitle: vcardJobTitle,
            address: vcardAddress,
            website: vcardWebsite,
          };
          metadata = {
            vcardFirstName,
            vcardLastName,
            vcardPhone,
            vcardEmail,
            vcardCompany,
            vcardJobTitle,
            vcardAddress,
            vcardWebsite,
          };
          finalValue = "vcard";
          break;

        default:
          return res.status(400).json({ error: "Unsupported QR type" });
      }

      updates.value = generateQRContent(finalType, finalValue, extraData);
      updates.type = finalType;
      updates.metadata = metadata;
    }

    // Do NOT update qrSrc – the tracking URL remains the same

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
