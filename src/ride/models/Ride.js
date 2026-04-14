const { randomUUID } = require('crypto');

class Ride {
  constructor(userId, pickupLoc, dropLoc, vehicleType) {
    this.rideId = randomUUID();
    this.userId = userId;
    this.driverId = null; // Assigned later
    this.pickupLoc = pickupLoc; // Location object
    this.dropLoc = dropLoc;     // Location object
    this.vehicleType = vehicleType;
    this.status = 'REQUESTED'; // REQUESTED, ACCEPTED, STARTED, COMPLETED, CANCELLED
    this.fare = 0;
    this.currency = 'INR';
    this.timestamp = new Date();
  }
}
module.exports = { Ride };
