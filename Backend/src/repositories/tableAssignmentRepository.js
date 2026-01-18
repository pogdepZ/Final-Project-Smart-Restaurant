// src/repositories/tableAssignmentRepo.js
const db = require("../config/db");

// Lấy danh sách waiter (role=waiter)
exports.listWaiters = async () => {
  const sql = `
    SELECT id, name, email, role, created_at
    FROM public.users
    WHERE role = 'waiter'
    ORDER BY created_at DESC
  `;
  const res = await db.query(sql);
  return res.rows || [];
};

// Check waiter tồn tại
exports.getWaiterById = async (waiterId) => {
  const sql = `
    SELECT id, name, email, role
    FROM public.users
    WHERE id = $1
    LIMIT 1
  `;
  const res = await db.query(sql, [waiterId]);
  return res.rows?.[0] || null;
};

// Lấy tableIds mà waiter đang được assign
exports.listTableIdsByWaiter = async (waiterId) => {
  const sql = `
    SELECT table_id
    FROM public.table_assignments
    WHERE waiter_id = $1
    ORDER BY assigned_at DESC
  `;
  const res = await db.query(sql, [waiterId]);
  return (res.rows || []).map((r) => r.table_id);
};

// Validate tables: chỉ cho assign table active (tuỳ bạn)
exports.findTablesByIds = async (tableIds = []) => {
  if (!tableIds.length) return [];
  const sql = `
    SELECT id, status
    FROM public.tables
    WHERE id = ANY($1::uuid[])
  `;
  const res = await db.query(sql, [tableIds]);
  return res.rows || [];
};

// Xoá toàn bộ assignments của waiter
exports.deleteAllByWaiterTx = async (client, waiterId) => {
  const sql = `DELETE FROM public.table_assignments WHERE waiter_id = $1`;
  await client.query(sql, [waiterId]);
};

// Insert nhiều assignments
exports.insertManyTx = async (client, waiterId, tableIds = []) => {
  if (!tableIds.length) return 0;

  // insert bulk using unnest
  const sql = `
    INSERT INTO public.table_assignments (waiter_id, table_id)
    SELECT $1::uuid, x::uuid
    FROM unnest($2::uuid[]) AS x
    ON CONFLICT DO NOTHING
  `;
  const res = await client.query(sql, [waiterId, tableIds]);
  return res.rowCount || 0;
};

// List all assignments (bonus)
exports.listAllAssignments = async () => {
  const sql = `
    SELECT
      ta.waiter_id,
      u.name AS waiter_name,
      u.email AS waiter_email,
      ta.table_id,
      t.table_number,
      t.location,
      ta.assigned_at
    FROM public.table_assignments ta
    JOIN public.users u ON u.id = ta.waiter_id
    JOIN public.tables t ON t.id = ta.table_id
    ORDER BY ta.assigned_at DESC
  `;
  const res = await db.query(sql);
  return res.rows || [];
};
