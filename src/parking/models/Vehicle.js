const VehicleType = {
  CAR: 'CAR',
  BIKE: 'BIKE',
  TRUCK: 'TRUCK'
};

class Vehicle {
  constructor(id, licensePlate, type) {
    this.id = id;
    this.licensePlate = licensePlate;
    this.type = type;
  }
}

class Car extends Vehicle {
  constructor(id, licensePlate) {
    super(id, licensePlate, VehicleType.CAR);
  }
}

class Bike extends Vehicle {
  constructor(id, licensePlate) {
    super(id, licensePlate, VehicleType.BIKE);
  }
}

class Truck extends Vehicle {
  constructor(id, licensePlate) {
    super(id, licensePlate, VehicleType.TRUCK);
  }
}

module.exports = { VehicleType, Vehicle, Car, Bike, Truck };
