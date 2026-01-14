const db = require("../config/db");

class BillingRepository {
  // 1. Tìm các đơn chưa thanh toán của bàn
  async getUnpaidOrdersByTable(tableId) {
    const query = `
            SELECT 
                o.id as order_id, 
                o.total_amount, 
                o.created_at,
                json_agg(
                    json_build_object(
                        'name', oi.item_name,
                        'qty', oi.quantity,
                        'price', oi.price,
                        'subtotal', oi.subtotal,
                        -- 👇 THÊM ĐOẠN NÀY ĐỂ LẤY MODIFIERS 👇
                        'modifiers', (
                            SELECT COALESCE(
                                json_agg(json_build_object(
                                    'name', oim.modifier_name, 
                                    'price', oim.price
                                )), '[]'
                            )
                            FROM order_item_modifiers oim 
                            WHERE oim.order_item_id = oi.id
                        )
                        -- 👆 KẾT THÚC ĐOẠN THÊM 👆
                    )
                ) as items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.table_id = $1 
              AND (o.payment_status = 'unpaid' OR o.payment_status IS NULL)
              AND o.status != 'cancelled'
            GROUP BY o.id
            ORDER BY o.created_at ASC
        `;
    const result = await db.query(query, [tableId]);
    return result.rows;
  }

  // 2. Tạo Bill mới
  async createBill({
    table_id,
    subtotal,
    tax_amount,
    discount_type,
    discount_value,
    total_amount,
    payment_method,
    user_id,
  }) {
    const result = await db.query(
      `INSERT INTO bills 
            (table_id, subtotal, tax_amount, discount_type, discount_value, total_amount, payment_method, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
      [
        table_id,
        subtotal,
        tax_amount,
        discount_type,
        discount_value,
        total_amount,
        payment_method,
        user_id,
      ]
    );
    return result.rows[0];
  }

  // 3. Cập nhật Orders (Đánh dấu đã thanh toán và link vào Bill)
  async markOrdersAsPaid(orderIds, billId) {
    await db.query(
      `UPDATE orders 
            SET payment_status = 'paid', status = 'completed', bill_id = $1 
            WHERE id = ANY($2::uuid[])`,
      [billId, orderIds]
    );
  }
}

module.exports = new BillingRepository();
