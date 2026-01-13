const service = require("../services/adminOrderService");

const sendError = (res, err, defaultMsg) => {
  const status = err?.status || 500;
  if (status === 500) console.error(defaultMsg, err);
  return res.status(status).json({ message: err?.message || defaultMsg });
};

exports.listOrders = async (req, res) => {
  try {
    const data = await service.listOrders(req.query);
    return res.json(data);
  } catch (err) {
    return sendError(res, err, "Server error");
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const data = await service.getOrderDetail(req.params.id);
    if (!data) return res.status(404).json({ message: "Order not found" });
    return res.json(data);
  } catch (err) {
    return sendError(res, err, "Server error");
  }
};
