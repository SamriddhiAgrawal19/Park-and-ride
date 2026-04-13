const { ParkingService } = require('../services/ParkingService');
const { AppError } = require('../utils/errors');
const { VehicleType } = require('../models/Vehicle');
const { HourlyPricingStrategy, DailyPricingStrategy } = require('../strategies/PricingStrategy');
const { CardPayment, CashPayment, UPIPayment } = require('../strategies/PaymentStrategy');

const parkingService = new ParkingService();

class ParkingController {
  
  // RESERVATION SYSTEM
  static createReservation(req, res, next) {
    try {
      const { type, licensePlate, startTime, endTime } = req.body;
      if (!type || !licensePlate || !startTime || !endTime) {
         throw new AppError(400, 'Missing fields needed for reservation (type, licensePlate, startTime, endTime)');
      }
      if (!Object.values(VehicleType).includes(type)) throw new AppError(400, 'Invalid vehicle type');

      const reservation = parkingService.createReservation(type, licensePlate, startTime, endTime);
      res.status(201).json({ message: 'Reservation created successfully', reservation });
    } catch (error) { next(error); }
  }

  static getReservation(req, res, next) {
     try {
       const { id } = req.params;
       res.status(200).json({ reservation: parkingService.getReservation(id) });
     } catch (error) { next(error); }
  }

  static cancelReservation(req, res, next) {
     try {
       const { id } = req.params;
       res.status(200).json({ message: 'Reservation cancelled', reservation: parkingService.cancelReservation(id) });
     } catch (error) { next(error); }
  }

  // CORE FUNCTIONS
  static checkIn(req, res, next) {
    try {
      const { type, licensePlate, reservationId } = req.body;

      if (!type || !licensePlate) {
        throw new AppError(400, 'Vehicle type and license plate are required');
      }

      if (!Object.values(VehicleType).includes(type)) {
        throw new AppError(400, 'Invalid vehicle type');
      }

      const ticket = parkingService.checkIn(type, licensePlate, reservationId);
      res.status(201).json({
        message: 'Vehicle parked successfully',
        ticket
      });
    } catch (error) {
      next(error);
    }
  }

  static checkOut(req, res, next) {
    try {
      const { ticketId, pricingMethod = 'HOURLY', paymentMethod = 'CARD' } = req.body;

      if (!ticketId) {
        throw new AppError(400, 'Ticket ID is required');
      }

      const pricingStrategy = pricingMethod === 'DAILY' ? new DailyPricingStrategy() : new HourlyPricingStrategy();
      
      let paymentStrategy;
      switch (paymentMethod) {
        case 'CASH': paymentStrategy = new CashPayment(); break;
        case 'UPI': paymentStrategy = new UPIPayment(); break;
        case 'CARD':
        default: paymentStrategy = new CardPayment(); break;
      }

      const ticket = parkingService.checkOut(ticketId, pricingStrategy, paymentStrategy);

      res.status(200).json({
        message: 'Vehicle checked out successfully',
        ticket
      });
    } catch (error) {
      next(error);
    }
  }

  // AVAILABILITY APIs
  static getAvailableSpots(req, res) {
    const spots = parkingService.getAvailableSpots();
    res.status(200).json({ count: spots.length, spots });
  }

  static getOccupiedSpots(req, res) {
    const spots = parkingService.getOccupiedSpots();
    res.status(200).json({ count: spots.length, spots });
  }

  static getAllSpots(req, res) {
    const spots = parkingService.getAllSpots();
    res.status(200).json({ count: spots.length, spots });
  }
}

module.exports = { ParkingController };
