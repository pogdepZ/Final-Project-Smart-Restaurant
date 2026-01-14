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

exports.updateOrderItemStatus = async (req, res) => {
    const { itemId } = req.params;
    const { status } = req.body; // 'accepted' | 'rejected'

    try {
      const order = await orderService.updateItemStatus(itemId, status);
      res.json({ message: "Đã cập nhật món", order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { page = 1, limit = 10 } = req.query;

    const data = await orderService.getMyOrders(userId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    return res.json(data);
  } catch (e) {
    console.error("getMyOrders error:", e);
    return res.status(500).json({ message: "Lỗi server" });
  }
};


exports.getMyOrderDetail = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const orderId = req.params.id;
    const order = await orderService.getMyOrderDetail(userId, orderId);

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    return res.json(order);
  } catch (e) {
    console.error("getMyOrderDetail error:", e);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
