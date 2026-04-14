const razorpayService = require('../services/razorpayService');
const paymentService = require('../services/paymentService');
const crypto = require('crypto');

/**
 * 1. Checkout API (Create Razorpay Order prior to frontend payment)
 */
const checkout = async (req, res) => {
  try {
    const { amount, currency = 'INR', purpose, referenceId } = req.body;

    if (!amount || !purpose || !referenceId) {
      return res.status(400).json({ success: false, message: 'Amount, purpose, and referenceId are required.' });
    }

    const order = await razorpayService.createOrder(amount, currency);

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ success: false, message: 'Could not create order' });
  }
};

/**
 * 2. Verify Payment API (Secure processing after UI confirmation)
 */
const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      purpose, 
      referenceId, 
      amount 
    } = req.body;

    // Step 1: Verify the Razorpay cryptographic signature. Never trust frontend blindly.
    const isValidSignature = razorpayService.verifySignature(
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Optional Step 2: Extract deeper bank details if necessary
    // const paymentDetails = await razorpayService.fetchPaymentDetails(razorpay_payment_id);
    // console.log("Payment Method:", paymentDetails.method);

    // Step 3: Trigger our unified Parking/Ride business logic!
    const paymentRecord = await paymentService.processPayment({
      purpose,
      referenceId,
      paymentId: razorpay_payment_id,
      amount
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and recorded correctly.',
      data: paymentRecord
    });
  } catch (error) {
    console.error('Payment Verification Error:', error.message);
    
    // Domain validations
    if (error.message.match(/not found|Invalid|already|Must be/i)) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Internal server error during payment verification' });
  }
};

/**
 * Bonus: Generic Webhook endpoint for Razorpay Events (e.g., async background capture)
 */
const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET';
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) throw new Error("No signature found");

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid Webhook Signature' });
    }

    const { event, payload } = req.body;
    console.log(`[Webhook Event Received]: ${event}`);

    // Here you can process 'payment.captured' asynchronously
    // if you didn't already process it via verifyPayment.

    res.status(200).json({ status: 'ok' });
  } catch(error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = {
  checkout,
  verifyPayment,
  razorpayWebhook
};
