const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['parking', 'ride'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Can reference Ticket or Ride
    required: true,
  },
  method: {
    type: String,
    enum: ['razorpay'],
    default: 'razorpay',
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success',
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
