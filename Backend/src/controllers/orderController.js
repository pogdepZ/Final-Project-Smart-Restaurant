const orderService = require("../services/orderService");

exports.createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body, req.io);
    res.status(201).json({ message: "Đặt món thành công", order });
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Lỗi đặt hàng" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrders(req.query);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách" });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await orderService.getOrderDetails(req.params.id);
    res.json(order);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const updated = await orderService.updateStatus(
      req.params.id,
      req.body,
      req.io
    );
    res.json(updated);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
};
