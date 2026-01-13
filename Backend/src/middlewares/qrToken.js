const jwt = require("jsonwebtoken");
const config = require("../config");

function requireQrToken(req, res, next) {
  const token = req.headers["x-qr-token"];
  if (!token) return res.status(401).json({ message: "QR_REQUIRED" });

  try {
    const payload = jwt.verify(token, config.auth.qrTokenSecret);
    // payload nên có: { tableId, tenantId, ... }
    req.qr = payload;   
    return next();
  } catch (e) {
    return res.status(401).json({ message: "QR_INVALID" });
  }
}

module.exports = { requireQrToken };
