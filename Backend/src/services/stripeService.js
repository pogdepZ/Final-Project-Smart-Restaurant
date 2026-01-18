const stripe = require("../config/stripe");
const billingRepo = require("../repositories/billingRepository");
const tableRepository = require("../repositories/tableRepository");
const tableSessionRepository = require("../repositories/tableSessionRepository");
const billRequestRepo = require("../repositories/billRequestRepository");
const socketService = require("./socketService");
const db = require("../config/db");
const billingService = require("./billingService");

class StripeService {
  /**
   * Tạo Payment Intent cho thanh toán Stripe
   * @param {string} tableId - ID của bàn
   * @param {object} paymentData - Thông tin thanh toán (discount_type, discount_value)
   * @returns {object} - clientSecret và paymentIntentId
   */
  async createPaymentIntent(tableId, paymentData) {
    const { discount_type = "none", discount_value = 0 } = paymentData;

    // 1. Lấy thông tin bill preview
    const billInfo = await billingService.previewTableBill(
      tableId,
      discount_type,
      discount_value,
    );

    if (!billInfo || billInfo.final_amount <= 0) {
      throw new Error("Không có đơn hàng cần thanh toán");
    }

    // 2. Chuyển đổi sang đơn vị nhỏ nhất (cent/xu)
    // Stripe yêu cầu amount tính bằng đơn vị nhỏ nhất của tiền tệ
    // VND không có đơn vị nhỏ hơn nên giữ nguyên, nhưng cần là số nguyên
    const amount = Math.round(billInfo.final_amount);

    // 3. Tạo Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "vnd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        tableId: tableId,
        orderIds: JSON.stringify(billInfo.order_ids),
        subtotal: billInfo.subtotal.toString(),
        taxAmount: billInfo.tax_amount.toString(),
        discountType: discount_type,
        discountValue: discount_value.toString(),
        finalAmount: billInfo.final_amount.toString(),
      },
      description: `Thanh toán bàn ${tableId}`,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      billInfo: billInfo,
    };
  }

  /**
   * Xác nhận thanh toán thành công và cập nhật database
   * @param {string} paymentIntentId - ID của Payment Intent
   * @param {string} userId - ID của user thực hiện thanh toán
   */
  async confirmPayment(paymentIntentId, userId) {
    // 1. Lấy thông tin Payment Intent từ Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new Error(
        `Thanh toán chưa hoàn tất. Trạng thái: ${paymentIntent.status}`,
      );
    }

    const metadata = paymentIntent.metadata;
    const tableId = metadata.tableId;
    const orderIds = JSON.parse(metadata.orderIds);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 2. Tạo Bill record
      const newBill = await billingRepo.createBill({
        table_id: tableId,
        subtotal: parseFloat(metadata.subtotal),
        tax_amount: parseFloat(metadata.taxAmount),
        discount_type: metadata.discountType,
        discount_value: parseFloat(metadata.discountValue),
        total_amount: parseFloat(metadata.finalAmount),
        payment_method: "stripe",
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
      });

      // 3. Update Orders (Link vào Bill)
      await billingRepo.markOrdersAsPaid(orderIds, newBill.id);

      // 4. Clear table session
      await tableRepository.clearSession(tableId);

      // 5. End session
      await tableSessionRepository.endSession(tableId);
      await tableSessionRepository.endAllActiveByTableId(tableId);

      // 6. Cancel bill requests
      await billRequestRepo.cancelAllPendingByTableId(tableId);

      await client.query("COMMIT");

      // 7. Notify via socket
      socketService.notifyTableUpdate({
        id: tableId,
        status: "active",
        is_paid: true,
      });

      return {
        success: true,
        bill: newBill,
        message: "Thanh toán thành công!",
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Xử lý Webhook từ Stripe
   * @param {object} event - Stripe webhook event
   */
  async handleWebhook(event) {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("💰 Payment succeeded:", paymentIntent.id);
        // Webhook có thể tự động xử lý, nhưng thường để frontend confirm
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("❌ Payment failed:", failedPayment.id);
        // Có thể gửi thông báo cho staff
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Lấy trạng thái Payment Intent
   * @param {string} paymentIntentId
   */
  async getPaymentStatus(paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }
}

module.exports = new StripeService();
