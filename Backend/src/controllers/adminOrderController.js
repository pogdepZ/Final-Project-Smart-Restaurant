const repo = require("../repositories/adminOrderRepository");

function toInt(n, fallback) {
  const x = parseInt(n, 10);
  return Number.isFinite(x) ? x : fallback;
}

exports.listOrders = async (req, res) => {
  try {
    const {
      q = "",
      status = "ALL",
      from = "",
      to = "",
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(toInt(page, 1), 1);
    const limitNum = Math.min(Math.max(toInt(limit, 20), 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const filters = { q, status, from, to };

    const total = await repo.countOrders(filters);
    const rows = await repo.findOrders(filters, { limit: limitNum, offset });

    const orders = rows.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status, // received|preparing|ready|completed|cancelled
      paymentStatus: r.payment_status, // unpaid|paid
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      note: r.note,
      totalAmount: Number(r.total_amount),
      totalItems: r.total_items,
      guestName: r.guest_name,
      userId: r.user_id,
      tableId: r.table_id,
      // bạn có tables schema thì đổi sang join lấy table_code/name
      tableName: r.table_id ? String(r.table_id).slice(0, 8) : (r.guest_name || "—"),
    }));

    return res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("listOrders error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const o = await repo.findOrderById(id);
    if (!o) return res.status(404).json({ message: "Order not found" });

    const items = await repo.findOrderItems(id);

    const order = {
      id: o.id,
      code: o.code,
      status: o.status,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      note: o.note,
      totalAmount: Number(o.total_amount),
      totalItems: o.total_items,
      guestName: o.guest_name,
      userId: o.user_id,
      tableId: o.table_id,
      tableName: o.table_id ? String(o.table_id).slice(0, 8) : (o.guest_name || "—"),
      items: items.map((it) => ({
        id: it.id,
        menuItemId: it.menu_item_id,
        name: it.item_name,
        unitPrice: Number(it.price),
        quantity: it.quantity,
        totalPrice: Number(it.subtotal),
        note: it.note,
      })),
    };

    return res.json({ order });
  } catch (err) {
    console.error("getOrderDetail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
