const repo = require("../repositories/adminOrderRepository");

function toInt(n, fallback) {
  const x = parseInt(n, 10);
  return Number.isFinite(x) ? x : fallback;
}

function mapOrderRow(r) {
  return {
    id: r.id,
    code: r.code,
    status: r.status, // received|preparing|ready|completed|rejected
    paymentStatus: r.payment_status, // unpaid|paid
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    note: r.note,
    totalAmount: Number(r.total_amount),
    totalItems: r.total_items,
    guestName: r.guest_name,
    userId: r.user_id,
    tableId: r.table_id,
    // TODO: nếu có join tables thì thay bằng table_code/table_name thật
    tableName: r.table_name || r.guest_name || "—",
  };
}

exports.listOrders = async (query) => {
  const {
    q = "",
    status = "ALL",
    from = "",
    to = "",
    page = "1",
    limit = "20",
  } = query || {};

  const pageNum = Math.max(toInt(page, 1), 1);
  const limitNum = Math.min(Math.max(toInt(limit, 20), 1), 100);
  const offset = (pageNum - 1) * limitNum;

  const filters = { q, status, from, to };

  const total = await repo.countOrders(filters);
  const rows = await repo.findOrders(filters, { limit: limitNum, offset });

  return {
    orders: (rows || []).map(mapOrderRow),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

exports.getOrderDetail = async (id) => {
  const o = await repo.findOrderById(id);
  if (!o) return null;

  const items = await repo.findOrderItems(id);

  const order = {
    ...mapOrderRow(o),
    items: (items || []).map((it) => ({
      id: it.id,
      menuItemId: it.menu_item_id,
      name: it.item_name,
      status: it.status,
      unitPrice: Number(it.price),
      quantity: it.quantity,
      totalPrice: Number(it.subtotal),
      note: it.note,
    })),
  };

  // sắp xếp items theo trạng thái 
  order.items.sort((a, b) => {
    const statusOrder = {
      received: 1,
      preparing: 2,
      ready: 3,
      completed: 4,
      rejected: 5,
    };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  return { order };
};
