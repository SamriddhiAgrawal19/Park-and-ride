const { ParkingLot } = require('../models/ParkingLot');
const { VehicleFactory } = require('../factory/VehicleFactory');
const { Ticket } = require('../models/Ticket');
const { randomUUID } = require('crypto');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class ParkingService {
  constructor() {
    this.parkingLot = ParkingLot.getInstance();
  }

  parkVehicle(type, licensePlate) {
    logger.info(`Attempting to park ${type} with license plate ${licensePlate}`);
    
    const spot = this.parkingLot.getAvailableSpotByType(type);
    if (!spot) {
      throw new AppError(400, 'No available spots for this vehicle type');
    }

    const vehicle = VehicleFactory.createVehicle(type, licensePlate);
    spot.park();

    const ticketId = randomUUID();
    const ticket = new Ticket(ticketId, vehicle, spot);
    this.parkingLot.addTicket(ticket);

    logger.info(`Vehicle parked successfully. Ticket ID: ${ticketId}`);
    return ticket;
  }

  exitVehicle(ticketId, pricingStrategy, paymentStrategy) {
    logger.info(`Process exit for ticket ID: ${ticketId}`);
    const ticket = this.parkingLot.getTicket(ticketId);

    if (!ticket) {
      throw new AppError(404, 'Ticket not found');
    }

    if (ticket.status === 'COMPLETED') {
      throw new AppError(400, 'Vehicle has already exited');
    }

    const now = new Date();
    // Simulate time difference, fallback to 1 hour if too quick
    let durationInHours = Math.abs(now.getTime() - ticket.entryTime.getTime()) / 36e5;
    if (durationInHours < 1) durationInHours = 1;

    const fee = pricingStrategy.calculateFee(durationInHours, ticket.vehicle.type);

    const paymentSuccess = paymentStrategy.processPayment(fee);
    if (!paymentSuccess) {
      throw new AppError(500, 'Payment failed');
    }

    ticket.closeTicket(fee);

    logger.info(`Vehicle exited successfully. Fee paid: $${fee}`);

    return ticket;
  }

  getAvailableSpots() {
    return this.parkingLot.getAvailableSpots();
  }

  getAllSpots() {
    return this.parkingLot.getAllSpots();
  }
}

module.exports = { ParkingService };
