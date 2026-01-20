// src/services/tableAssignmentService.js
const db = require("../config/db");
const repo = require("../repositories/tableAssignmentRepository");
const socketService = require("./socketService");

const toUiWaiter = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
});

exports.getWaiters = async () => {
  const rows = await repo.listWaiters();
  return { items: rows.map(toUiWaiter) };
};

exports.getAssignmentsByWaiter = async (waiterId) => {
  const waiter = await repo.getWaiterById(waiterId);
  if (!waiter) {
    const err = new Error("Waiter not found");
    err.status = 404;
    throw err;
  }
  if (waiter.role !== "waiter") {
    const err = new Error("User is not waiter");
    err.status = 400;
    throw err;
  }

  const tableIds = await repo.listTableIdsByWaiter(waiterId);
  return {
    waiter: toUiWaiter(waiter),
    tableIds: tableIds.map(String),
  };
};

// Replace toàn bộ assignment: xóa cũ -> insert mới
exports.replaceAssignments = async (waiterId, tableIds = []) => {
  const waiter = await repo.getWaiterById(waiterId);
  if (!waiter) {
    const err = new Error("Waiter not found");
    err.status = 404;
    throw err;
  }
  if (waiter.role !== "waiter") {
    const err = new Error("User is not waiter");
    err.status = 400;
    throw err;
  }

  // normalize ids
  const normalized = Array.from(new Set((tableIds || []).map(String))).filter(
    Boolean,
  );

  // validate table existence (và optionally status)
  if (normalized.length) {
    const found = await repo.findTablesByIds(normalized);
    const foundIds = new Set(found.map((x) => String(x.id)));

    const missing = normalized.filter((id) => !foundIds.has(id));
    if (missing.length) {
      const err = new Error(
        `Some tables not found: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "..." : ""}`,
      );
      err.status = 400;
      throw err;
    }

    // OPTIONAL: chỉ cho assign bàn active
    const inactive = found.filter((x) => x.status && x.status !== "active");
    if (inactive.length) {
      const err = new Error("Some tables are not active, cannot assign");
      err.status = 400;
      throw err;
    }
  }

  try {
    await db.query("BEGIN");

    // clear old
    await repo.deleteAllByWaiterTx(db, waiterId);

    // insert new
    await repo.insertManyTx(db, waiterId, normalized);

    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
  }

  const newIds = await repo.listTableIdsByWaiter(waiterId);

  // Lấy thông tin chi tiết các bàn để gửi qua socket
  let tables = [];
  if (newIds.length > 0) {
    tables = await repo.findTablesByIds(newIds.map(String));
  }

  // 🔔 Emit socket event để thông báo cho waiter
  socketService.notifyTableAssignmentUpdate({
    waiterId: waiterId,
    waiterName: waiter.name,
    tableIds: newIds.map(String),
    tables: tables.map((t) => ({
      id: t.id,
      table_number: t.table_number,
      location: t.location,
      capacity: t.capacity,
      status: t.status,
    })),
  });

  return {
    message: "Updated table assignments",
    waiter: toUiWaiter(waiter),
    tableIds: newIds.map(String),
  };
};

exports.listAll = async () => {
  const rows = await repo.listAllAssignments();
  return { items: rows };
};
