const { VehicleType } = require('../models/Vehicle');

class HourlyPricingStrategy {
  constructor() {
    this.rates = {
      [VehicleType.BIKE]: 10,
      [VehicleType.CAR]: 20,
      [VehicleType.TRUCK]: 50
    };
  }

  calculateFee(durationInHours, vehicleType) {
    return this.rates[vehicleType] * Math.ceil(durationInHours);
  }
}

class DailyPricingStrategy {
  constructor() {
    this.rates = {
      [VehicleType.BIKE]: 100,
      [VehicleType.CAR]: 200,
      [VehicleType.TRUCK]: 500
    };
  }

  calculateFee(durationInHours, vehicleType) {
    const days = Math.ceil(durationInHours / 24);
    return this.rates[vehicleType] * days;
  }
}

module.exports = { HourlyPricingStrategy, DailyPricingStrategy };
