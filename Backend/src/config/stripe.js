const Stripe = require("stripe");

// Khởi tạo Stripe với secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

module.exports = stripe;
