// utils/qrContentGenerator.js

export const QR_TYPES = [
  {
    value: "url",
    label: "URL",
    icon: "pi pi-globe",
    placeholder: "https://example.com",
  },
  {
    value: "text",
    label: "Text",
    icon: "pi pi-file",
    placeholder: "Enter your text here...",
  },
  {
    value: "email",
    label: "Email",
    icon: "pi pi-envelope",
    placeholder: "recipient@example.com",
  },
  {
    value: "phone",
    label: "Phone",
    icon: "pi pi-phone",
    placeholder: "+1234567890",
  },
  {
    value: "sms",
    label: "SMS",
    icon: "pi pi-comment",
    placeholder: "+1234567890",
  },
  { value: "wifi", label: "WiFi", icon: "pi pi-wifi", placeholder: "SSID" },
  {
    value: "location",
    label: "Location",
    icon: "pi pi-map-marker",
    placeholder: "Latitude,Longitude",
  },
  // NEW TYPES
  {
    value: "pdf",
    label: "PDF",
    icon: "pi pi-file-pdf",
    placeholder: "https://example.com/document.pdf",
  },
  {
    value: "event",
    label: "Event",
    icon: "pi pi-calendar",
    placeholder: "Event title",
  },
  {
    value: "vcard",
    label: "Visiting Card",
    icon: "pi pi-id-card",
    placeholder: "Full Name",
  },
];

/**
 * Generate the QR code content string based on type and provided data.
 * @param {string} type - The QR type (e.g., 'url', 'email', 'event').
 * @param {string} value - Primary value (for simple types) or identifier (for complex types).
 * @param {object} extraData - Additional fields needed for complex types.
 * @returns {string} The encoded content string.
 */
export const generateQRContent = (type, value, extraData = {}) => {
  switch (type) {
    case "url":
    case "text":
    case "pdf": // PDF just stores the URL
      return value;

    case "email": {
      let content = `mailto:${value}`;
      const params = [];
      if (extraData.subject)
        params.push(`subject=${encodeURIComponent(extraData.subject)}`);
      if (extraData.body)
        params.push(`body=${encodeURIComponent(extraData.body)}`);
      if (params.length) content += `?${params.join("&")}`;
      return content;
    }

    case "phone":
      return `tel:${value}`;

    case "sms": {
      let content = `smsto:${value}`;
      if (extraData.message)
        content += `:${encodeURIComponent(extraData.message)}`;
      return content;
    }

    case "wifi": {
      const encryption = extraData.encryption || "WPA";
      const password = extraData.password || "";
      if (encryption === "nopass") {
        return `WIFI:S:${value};;`;
      }
      return `WIFI:T:${encryption};S:${value};P:${password};;`;
    }

    case "location": {
      const [lat, lng] = value.split(",");
      return `geo:${lat},${lng}`;
    }

    case "event": {
      // Build iCalendar (VCALENDAR) content
      const {
        title = "",
        startDate = "",
        startTime = "",
        endDate = "",
        endTime = "",
        location = "",
        description = "",
        url = "",
      } = extraData;

      // Combine date and time into ISO format
      const startDateTime = combineDateTime(startDate, startTime);
      const endDateTime = combineDateTime(endDate, endTime);

      // Escape special characters for iCalendar
      const escapeText = (text) =>
        text.replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n");

      let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//QR Generator//EN
BEGIN:VEVENT
SUMMARY:${escapeText(title)}
DTSTART:${startDateTime}
DTEND:${endDateTime}`;

      if (location) ics += `\nLOCATION:${escapeText(location)}`;
      if (description) ics += `\nDESCRIPTION:${escapeText(description)}`;
      if (url) ics += `\nURL:${url}`;

      ics += `\nEND:VEVENT
END:VCALENDAR`;
      return ics;
    }

    case "vcard": {
      // Build vCard (vCard 3.0) content
      const {
        firstName = "",
        lastName = "",
        phone = "",
        email = "",
        company = "",
        jobTitle = "",
        address = "",
        website = "",
      } = extraData;

      const fullName = `${firstName} ${lastName}`.trim();
      const formattedName = fullName || "No Name";

      let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${formattedName}
N:${lastName};${firstName};;;`;

      if (phone) vcard += `\nTEL:${phone}`;
      if (email) vcard += `\nEMAIL:${email}`;
      if (company) vcard += `\nORG:${company}`;
      if (jobTitle) vcard += `\nTITLE:${jobTitle}`;
      if (address) vcard += `\nADR:;;${address};;;`;
      if (website) vcard += `\nURL:${website}`;

      vcard += `\nEND:VCARD`;
      return vcard;
    }

    default:
      return value;
  }
};

// Helper: Combine date and time into UTC ISO format (YYYYMMDDTHHMMSSZ)
function combineDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm" (24h)
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  // Format as YYYYMMDDTHHMMSSZ
  const pad = (n) => String(n).padStart(2, "0");
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    "T" +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Validate the value for a given QR type.
 * @param {string} type - The QR type.
 * @param {string} value - The primary value to validate.
 * @param {object} extraData - Additional fields for complex types.
 * @returns {string|null} Error message or null if valid.
 */
export const validateQRValue = (type, value, extraData = {}) => {
  if (!value || value.trim() === "") {
    return "This field is required";
  }

  switch (type) {
    case "url":
    case "pdf": {
      const urlRegex = /^https?:\/\/.+/i;
      if (!urlRegex.test(value.trim())) {
        return "URL must start with http:// or https://";
      }
      break;
    }

    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        return "Please enter a valid email address";
      }
      break;
    }

    case "phone":
    case "sms": {
      const phoneRegex =
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(value.trim())) {
        return "Please enter a valid phone number";
      }
      break;
    }

    case "location": {
      const parts = value.split(",");
      if (
        parts.length !== 2 ||
        isNaN(parseFloat(parts[0])) ||
        isNaN(parseFloat(parts[1]))
      ) {
        return "Please enter valid coordinates (latitude,longitude)";
      }
      break;
    }

    case "event": {
      // Extra validation for event fields
      const { startDate, startTime, endDate, endTime } = extraData;
      if (!startDate || !startTime || !endDate || !endTime) {
        return "Please provide start and end date/time";
      }
      // Optional: check date/time format
      break;
    }

    case "vcard": {
      // Ensure at least name is provided (value is firstName)
      if (!value.trim()) {
        return "First name is required";
      }
      break;
    }
  }

  return null;
};
