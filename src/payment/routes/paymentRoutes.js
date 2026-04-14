const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// [POST] /api/payment/checkout -> Create Razorpay Order
router.post('/checkout', paymentController.checkout);

// [POST] /api/payment/verify -> Verify Signature + Run Unified Pay Logic
router.post('/verify', paymentController.verifyPayment);

// [POST] /api/payment/webhook -> Bonus async webhook parsing
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.razorpayWebhook);

module.exports = router;
