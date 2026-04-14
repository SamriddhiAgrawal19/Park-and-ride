const mongoose = require('mongoose');
const Payment = require('../models/Payment');

// Import your domain models here
// Assuming these Mongoose models are registered globally or you can directly string-import them
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket');
const Ride = mongoose.models.Ride || mongoose.model('Ride');
const ParkingSpot = mongoose.models.ParkingSpot || mongoose.model('ParkingSpot');

const processPayment = async ({ purpose, referenceId, paymentId, amount }) => {
  // Validate Purpose
  if (!['parking', 'ride'].includes(purpose)) {
    throw new Error('Invalid payment purpose. Must be "parking" or "ride".');
  }

  // Idempotency check: see if this paymentId was already completed successfully
  const existingPayment = await Payment.findOne({ transactionId: paymentId });
  if (existingPayment && existingPayment.status === 'success') {
    throw new Error('Payment already processed for this transaction ID.');
  }

  if (purpose === 'parking') {
    // ----------------------------------------
    // CASE 1: Parking Payment
    // ----------------------------------------
    const ticket = await Ticket.findById(referenceId);
    if (!ticket) {
      throw new Error('Ticket reference not found.');
    }
    if (ticket.status === 'completed') {
      throw new Error('Parking ticket is already paid/completed.');
    }
    if (ticket.status !== 'active') {
      throw new Error('Invalid ticket status for payment.');
    }

    // Process Ticket
    ticket.status = 'completed';
    ticket.exitTime = new Date();
    await ticket.save();

    // Free the parking spot
    const spot = await ParkingSpot.findById(ticket.spotId);
    if (spot) {
      spot.isAvailable = true;
      await spot.save();
    }
  } else if (purpose === 'ride') {
    // ----------------------------------------
    // CASE 2: Ride Payment
    // ----------------------------------------
    const ride = await Ride.findById(referenceId);
    if (!ride) {
      throw new Error('Ride reference not found.');
    }
    if (ride.status === 'paid') {
      throw new Error('Ride is already paid.');
    }
    if (ride.status !== 'completed') {
      // Must be completed before paying, according to requirements
      throw new Error('Ride must be completed before payment can be processed.');
    }

    // Process Ride
    ride.status = 'paid';
    await ride.save();
  }

  // ----------------------------------------
  // Save Payment Record
  // ----------------------------------------
  const paymentRecord = new Payment({
    amount,
    purpose,
    referenceId,
    method: 'razorpay',
    transactionId: paymentId,
    status: 'success'
  });

  await paymentRecord.save();

  return paymentRecord;
};

module.exports = {
  processPayment
};
