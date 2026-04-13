const { ParkingLot } = require('../models/ParkingLot');
const { VehicleFactory } = require('../factory/VehicleFactory');
const { Ticket } = require('../models/Ticket');
const { Reservation } = require('../models/Reservation');
const { randomUUID } = require('crypto');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class ParkingService {
  constructor() {
    this.parkingLot = ParkingLot.getInstance();
  }

  createReservation(type, licensePlate, startTime, endTime) {
    if (new Date(startTime) >= new Date(endTime)) {
      throw new AppError(400, 'End time must be after start time');
    }

    const spot = this.parkingLot.getAvailableSpotForReservation(type, startTime, endTime);
    if (!spot) {
      throw new AppError(400, 'No available spots for this time period');
    }

    const reservation = new Reservation(type, licensePlate, startTime, endTime);
    reservation.spotId = spot.id;
    
    spot.reserve(reservation);
    this.parkingLot.addReservation(reservation);

    logger.info(`Reservation created: ${reservation.id} for spot ${spot.id}`);
    return reservation;
  }

  cancelReservation(reservationId) {
    const reservation = this.parkingLot.getReservation(reservationId);
    if (!reservation) throw new AppError(404, 'Reservation not found');
    if (reservation.status !== 'ACTIVE') throw new AppError(400, 'Only active reservations can be cancelled');

    reservation.status = 'CANCELLED';
    logger.info(`Reservation cancelled: ${reservationId}`);
    return reservation;
  }

  getReservation(reservationId) {
    const res = this.parkingLot.getReservation(reservationId);
    if (!res) throw new AppError(404, 'Reservation not found');
    return res;
  }

  checkIn(type, licensePlate, reservationId = null) {
    logger.info(`Attempting check-in for ${type} [${licensePlate}] (Reservation: ${reservationId})`);

    // Prevent double check-in
    const existingTicket = Array.from(this.parkingLot.tickets.values())
      .find(t => t.vehicle.licensePlate === licensePlate && t.status === 'ACTIVE');
    if (existingTicket) {
      throw new AppError(400, 'Vehicle is already parked inside');
    }

    let spot = null;

    if (reservationId) {
      const reservation = this.parkingLot.getReservation(reservationId);
      if (!reservation) throw new AppError(404, 'Reservation not found');
      if (reservation.status !== 'ACTIVE') throw new AppError(400, 'Reservation is not active or already fulfilled');
      if (reservation.licensePlate !== licensePlate) throw new AppError(400, 'License plate mismatch for reservation');
      
      spot = this.parkingLot.getSpotById(reservation.spotId);
      if (!spot || !spot.isFree) {
        throw new AppError(500, 'System Error: Reserved spot is unexpectedly occupied');
      }
      spot.park(reservationId);
    } else {
      spot = this.parkingLot.getAvailableSpotForWalkIn(type);
      if (!spot) {
        throw new AppError(400, 'No available spots for walk-in parking right now');
      }
      spot.park();
    }

    const vehicle = VehicleFactory.createVehicle(type, licensePlate);
    const ticketId = randomUUID();
    const ticket = new Ticket(ticketId, vehicle, spot);
    this.parkingLot.addTicket(ticket);

    logger.info(`Vehicle checked in successfully. Ticket ID: ${ticketId}`);
    return ticket;
  }

  checkOut(ticketId, pricingStrategy, paymentStrategy) {
    logger.info(`Process check-out for ticket ID: ${ticketId}`);
    const ticket = this.parkingLot.getTicket(ticketId);

    if (!ticket) {
      throw new AppError(404, 'Exit failed: Ticket not found. Entry required before exit.');
    }

    if (ticket.status === 'COMPLETED') {
      throw new AppError(400, 'Vehicle has already exited');
    }

    const now = new Date();
    // Calculate duration in hours, min 1 hour limit for logic
    let durationInHours = Math.abs(now.getTime() - ticket.entryTime.getTime()) / 36e5;
    if (durationInHours < 1) durationInHours = 1;

    const fee = pricingStrategy.calculateFee(durationInHours, ticket.vehicle.type);

    const paymentSuccess = paymentStrategy.processPayment(fee);
    if (!paymentSuccess) {
      throw new AppError(500, 'Payment failed, transaction reverted');
    }

    ticket.closeTicket(fee);

    logger.info(`Vehicle exited successfully. Spot ${ticket.spotId} vacated. Fee paid: $${fee}`);

    return ticket;
  }

  getAvailableSpots() {
    return this.parkingLot.getAvailableSpots();
  }

  getOccupiedSpots() {
    return this.parkingLot.getOccupiedSpots();
  }

  getAllSpots() {
    return this.parkingLot.getAllSpots();
  }
}

module.exports = { ParkingService };
