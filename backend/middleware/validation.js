// URL validation
export const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

// Name validation (min 3 chars, no spaces)
export const isValidName = (name) => {
  return name && name.trim().length >= 3 && !name.includes(" ");
};

// Validation middleware for QR creation/update
export const validateQRData = (req, res, next) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: "Name and URL are required" });
  }

//   if (!isValidName(name)) {
//     return res.status(400).json({
//       error: "Name must be at least 3 characters and contain no spaces",
//     });
//   }

  if (!isValidUrl(url)) {
    return res.status(400).json({
      error: "URL must start with http:// or https://",
    });
  }

  next();
};
