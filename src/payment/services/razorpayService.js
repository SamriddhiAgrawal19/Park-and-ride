const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
    });
  }

  /**
   * Automatically convert INR amount to paise before creating the Order.
   */
  async createOrder(amount, currency = "INR") {
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: `receipt_${Date.now()}`
    };

    return await this.razorpay.orders.create(options);
  }

  /**
   * Verify authenticity of incoming Razorpay payment via signatures
   */
  verifySignature(orderId, paymentId, signature) {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET';
    const body = orderId + "|" + paymentId;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');
      
    return expectedSignature === signature;
  }

  /**
   * Optional: Safely fetch the transaction details directly from Razorpay.
   * Useful to verify actual capturing and extract the payment method ('upi', 'card', etc)
   */
  async fetchPaymentDetails(paymentId) {
    return await this.razorpay.payments.fetch(paymentId);
  }
}

module.exports = new RazorpayService();
