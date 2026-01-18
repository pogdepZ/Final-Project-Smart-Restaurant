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


exports.getOrdersByTable = async (req, res) => {
  try {
    const qrToken = req.headers['qrToken'] || req.get('qrToken');    
    if (!qrToken) {
      return res.status(400).json({ message: "Thiếu table token" });
    }
    const orders = await orderService.getOrdersByTableToken(qrToken);    
    return res.json(orders);
  } catch (e) {

    console.error("getOrdersByTable error:", e);

    return res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
    const orderId = req.params.id;
    const tableToken = req.query.tableToken;
    if (!tableToken) {
      return res.status(400).json({ message: "Thiếu table token" });
    }
    const order = await orderService.getOrderTrackingByTableToken(orderId, tableToken);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    return res.json(order);
  } catch (e) {
    console.error("getOrderTracking error:", e);
    return res.status(500).json({ message: "Lỗi server" });
  } 
};

exports.getUnpaidOrderByUserId = async (req, res) => {
  try {
    // console.log("getUnpaidOrderByUserId called with:", req.query);
    const { userId, tableId, sessionId } = req.query;
    if (!userId || !tableId || !sessionId) {
      return res.status(201).json({ success:false, message: "Thiếu thông tin cần thiết" });
    } 
    const order = await orderService.getUnpaidOrderByUserId(userId, tableId, sessionId);
    if (!order) {
      return res.status(201).json({ success:false, message: "Bạn không có đơn hàng nào cần được thanh toán!" });
    }
    return res.status(200).json({ success:true, order });
  } catch (e) {
    console.error("getUnpaidOrderByUserId error:", e);
    return res.status(500).json({ success:false, message: "Lỗi server" });
  }
};