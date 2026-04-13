const { Car, Bike, Truck, VehicleType } = require('../models/Vehicle');
const { randomUUID } = require('crypto');

class VehicleFactory {
  static createVehicle(type, licensePlate) {
    const id = randomUUID();
    switch (type) {
      case VehicleType.CAR:
        return new Car(id, licensePlate);
      case VehicleType.BIKE:
        return new Bike(id, licensePlate);
      case VehicleType.TRUCK:
        return new Truck(id, licensePlate);
      default:
        throw new Error(`Vehicle type ${type} is not supported.`);
    }
  }
}

module.exports = { VehicleFactory };
