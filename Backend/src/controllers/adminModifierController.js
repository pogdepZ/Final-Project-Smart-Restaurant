const service = require("../services/adminModifierService");

const sendError = (res, err, defaultMsg) => {
  const status = err?.status || 500;
  if (status === 500) console.error(defaultMsg, err);
  return res.status(status).json({ message: err?.message || defaultMsg });
};

exports.getModifierGroups = async (req, res) => {
  try {
    const data = await service.getModifierGroups(req.query);
    return res.json(data);
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};
