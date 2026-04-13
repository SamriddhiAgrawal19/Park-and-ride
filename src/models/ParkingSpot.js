const { VehicleType } = require('./Vehicle');

class ParkingSpot {
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.isFree = true;
  }

  park() {
    if (!this.isFree) {
      throw new Error("Spot is already occupied");
    }
    this.isFree = false;
  }

  vacate() {
    this.isFree = true;
  }
}

class CarSpot extends ParkingSpot {
  constructor(id) {
    super(id, VehicleType.CAR);
  }
}

class BikeSpot extends ParkingSpot {
  constructor(id) {
    super(id, VehicleType.BIKE);
  }
}

class TruckSpot extends ParkingSpot {
  constructor(id) {
    super(id, VehicleType.TRUCK);
  }
}

module.exports = { ParkingSpot, CarSpot, BikeSpot, TruckSpot };
