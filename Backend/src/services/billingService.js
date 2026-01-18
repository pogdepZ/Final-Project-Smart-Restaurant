const billingRepo = require("../repositories/billingRepository");
const tableRepository = require("../repositories/tableRepository");
const tableSessionRepository = require("../repositories/tableSessionRepository");
const billRequestRepo = require("../repositories/billRequestRepository");
const socketService = require("./socketService");
const db = require("../config/db");

class BillingService {
  // A. Xem trước hóa đơn (Preview)
  async previewTableBill(tableId, discountType = "none", discountValue = 0) {
    // 1. Lấy tất cả đơn chưa trả của bàn
    const orders = await billingRepo.getUnpaidOrdersByTable(tableId);

    if (orders.length === 0)
      throw new Error("Bàn này không có đơn nào chưa thanh toán");

    // 2. Gộp Items & Tính toán lại giá tiền chi tiết (Cần sửa đoạn này)
    let aggregatedItems = [];
    let subtotal = 0; // Tổng tiền hàng (chưa thuế/giảm giá)

    orders.forEach((order) => {
      order.items.forEach((item) => {
        // --- BƯỚC TÍNH TOÁN LẠI GIÁ ---

        // A. Tính tổng tiền modifiers (Topping)
        const modifiersTotal = (item.modifiers || []).reduce((sum, mod) => {
          return sum + Number(mod.price || 0);
        }, 0);

        // B. Tính giá đơn vị thực tế (Giá gốc + Giá Topping)
        const realUnitPrice = Number(item.price) + modifiersTotal;

        // C. Tính thành tiền của dòng này (Giá thực tế * Số lượng)
        const lineTotal = realUnitPrice * item.qty;

        // D. Cộng vào tổng hóa đơn (Subtotal tổng)
        // Lưu ý: Tốt nhất nên cộng dồn từ item để chính xác nhất, thay vì tin tưởng order.total_amount
        subtotal += lineTotal;

        // E. Push vào danh sách hiển thị
        aggregatedItems.push({
          ...item,
          price_base: Number(item.price), // Giá gốc (để tham khảo nếu cần)
          modifiers_price: modifiersTotal, // Tổng tiền topping

          // Hai trường quan trọng frontend cần:
          price: realUnitPrice, // Đơn giá đầy đủ (Gốc + Topping)
          subtotal: lineTotal, // Thành tiền (Đơn giá đầy đủ * SL)

          order_time: order.created_at,
        });
      });
    });

    // 3. Tính toán Thuế & Giảm giá (Logic giữ nguyên)
    let discountAmount = 0;
    if (discountType === "percent") {
      discountAmount = subtotal * (discountValue / 100);
    } else if (discountType === "fixed") {
      discountAmount = discountValue;
    }

    // Đảm bảo không giảm giá quá số tiền hiện có
    if (discountAmount > subtotal) discountAmount = subtotal;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRate = 0.1;
    const taxAmount = taxableAmount * taxRate;
    const finalAmount = taxableAmount + taxAmount;

    return {
      table_id: tableId,
      orders_count: orders.length,
      order_ids: orders.map((o) => o.order_id),
      items: aggregatedItems,
      subtotal: subtotal, // Tổng tiền hàng chính xác sau khi cộng gộp item
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      final_amount: finalAmount,
    };
  }

  // B. Thanh toán (Checkout)
  async processTablePayment(tableId, userId, paymentData) {
    const { payment_method, discount_type, discount_value } = paymentData;

    // 1. Tính toán lại
    const billInfo = await this.previewTableBill(
      tableId,
      discount_type,
      discount_value
    );

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 2. Tạo Bill record
      const newBill = await billingRepo.createBill({
        table_id: tableId,
        subtotal: billInfo.subtotal,
        tax_amount: billInfo.tax_amount,
        discount_type: paymentData.discount_type,
        discount_value: paymentData.discount_value,
        total_amount: billInfo.final_amount,
        payment_method: payment_method,
        user_id: userId,
      });

      // 3. Update Orders (Link vào Bill)
      await billingRepo.markOrdersAsPaid(billInfo.order_ids, newBill.id);

      // 4. Sau khi thanh toán xong, xóa session bàn để cho khách khác sử dụng
      await tableRepository.clearSession(tableId);

      // 5. Cập nhật giá trị ended_at cho session vừa xóa
      await tableSessionRepository.endSession(tableId);
      await tableSessionRepository.endAllActiveByTableId(tableId);

      // 6. Hủy tất cả bill requests của bàn này
      await billRequestRepo.cancelAllPendingByTableId(tableId);

      await client.query("COMMIT");

      // 5. Bắn Socket báo bàn đã thanh toán (Clear màn hình Waiter/Kitchen)
      socketService.notifyTableUpdate({
        id: tableId,
        status: "active",
        is_paid: true,
      });

      return newBill;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new BillingService();
