const { ParkingService } = require('../services/ParkingService');
const { AppError } = require('../utils/errors');
const { VehicleType } = require('../models/Vehicle');
const { HourlyPricingStrategy, DailyPricingStrategy } = require('../strategies/PricingStrategy');
const { CardPayment, CashPayment, UPIPayment } = require('../strategies/PaymentStrategy');

const parkingService = new ParkingService();

class ParkingController {
  static park(req, res, next) {
    try {
      const { type, licensePlate } = req.body;

      if (!type || !licensePlate) {
        throw new AppError(400, 'Vehicle type and license plate are required');
      }

      if (!Object.values(VehicleType).includes(type)) {
        throw new AppError(400, 'Invalid vehicle type');
      }

      const ticket = parkingService.parkVehicle(type, licensePlate);
      res.status(201).json({
        message: 'Vehicle parked successfully',
        ticket
      });
    } catch (error) {
      next(error);
    }
  }

  static exit(req, res, next) {
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

      const ticket = parkingService.exitVehicle(ticketId, pricingStrategy, paymentStrategy);

      res.status(200).json({
        message: 'Vehicle exited successfully',
        ticket
      });
    } catch (error) {
      next(error);
    }
  }

  static getAvailableSpots(req, res) {
    const spots = parkingService.getAvailableSpots();
    res.status(200).json({ spots });
  }

  static getAllSpots(req, res) {
    const spots = parkingService.getAllSpots();
    res.status(200).json({ spots });
  }
}

module.exports = { ParkingController };
