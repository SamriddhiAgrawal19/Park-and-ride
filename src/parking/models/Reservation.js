const { randomUUID } = require('crypto');

class Reservation {
  constructor(vehicleType, licensePlate, startTime, endTime) {
    this.id = randomUUID();
    this.vehicleType = vehicleType;
    this.licensePlate = licensePlate;
    this.startTime = new Date(startTime);
    this.endTime = new Date(endTime);
    this.status = 'ACTIVE'; // ACTIVE, CANCELLED, FULFILLED
    this.spotId = null;
  }
}

module.exports = { Reservation };
