const stripeService = require("../services/stripeService");
const stripe = require("../config/stripe");

/**
 * Tạo Payment Intent cho Stripe Checkout
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { discount_type, discount_value } = req.body;

    const result = await stripeService.createPaymentIntent(tableId, {
      discount_type,
      discount_value,
    });

    res.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: result.amount,
      billInfo: result.billInfo,
    });
  } catch (err) {
    console.error("Create Payment Intent Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Xác nhận thanh toán sau khi Stripe xử lý xong
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user?.id;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu paymentIntentId",
      });
    }

    const result = await stripeService.confirmPayment(paymentIntentId, userId);

    res.json(result);
  } catch (err) {
    console.error("Confirm Payment Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Webhook handler cho Stripe
 * Lưu ý: Route này cần raw body, không parse JSON
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Nếu không có webhook secret (development), parse trực tiếp
      event = req.body;
    }

    // Xử lý event
    const result = await stripeService.handleWebhook(event);
    res.json(result);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }
};

/**
 * Lấy trạng thái Payment Intent
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const status = await stripeService.getPaymentStatus(paymentIntentId);

    res.json({
      success: true,
      ...status,
    });
  } catch (err) {
    console.error("Get Payment Status Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Tạo Payment Link cho thanh toán QR Code (Stripe Checkout)
 */
exports.createPaymentLink = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { discount_type, discount_value } = req.body;

    const result = await stripeService.createPaymentLink(tableId, {
      discount_type,
      discount_value,
    });

    res.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url,
      amount: result.amount,
      billInfo: result.billInfo,
    });
  } catch (err) {
    console.error("Create Payment Link Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Lấy Stripe config (publishable key)
 */
exports.getConfig = (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
};

/**
 * Kiểm tra trạng thái Checkout Session
 */
exports.getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const status = await stripeService.getSessionStatus(sessionId);

    res.json({
      success: true,
      ...status,
    });
  } catch (err) {
    console.error("Get Session Status Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Lấy Stripe publishable key cho frontend
 */
exports.getConfig = async (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
};
