const jwt = require("jsonwebtoken");
const config = require("../config");

exports.optionalAuth = (req, _res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  console.log("AUTH HEADER:", req.headers.authorization);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, config.auth.accessTokenSecret);
    req.user = payload;
  } catch (e) {
    req.user = null; // token sai/hết hạn -> coi như guest
  }
  next();
};
