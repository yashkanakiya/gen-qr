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
];

export const generateQRContent = (type, value, extraData = {}) => {
  switch (type) {
    case "url":
      return value;
    case "text":
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
    default:
      return value;
  }
};

export const validateQRValue = (type, value) => {
  if (!value || value.trim() === "") {
    return "This field is required";
  }

  switch (type) {
    case "url":
      const urlRegex = /^https?:\/\/.+/i;
      if (!urlRegex.test(value.trim())) {
        return "URL must start with http:// or https://";
      }
      break;
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        return "Please enter a valid email address";
      }
      break;
    case "phone":
    case "sms":
      const phoneRegex =
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(value.trim())) {
        return "Please enter a valid phone number";
      }
      break;
    case "location":
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
  return null;
};
