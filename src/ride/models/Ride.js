const { randomUUID } = require('crypto');

class Ride {
  constructor(userId, pickupLoc, dropLoc, vehicleType, rideType = 'solo') {
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

    // Features specifically for Shared Rides
    this.rideType = rideType; // 'solo' | 'shared'
    
    // Validate Max Capacity
    this.maxCapacity = (rideType === 'shared' && vehicleType.toLowerCase() === 'car') ? 4 : 1;
    
    // Store current riders
    this.currentRiders = [{ 
      userId, 
      pickup: pickupLoc, 
      drop: dropLoc 
    }];
    
    // For fast retrieval inside matching service
    this.routeDetails = {
      pickup: { lat: pickupLoc.latitude, lng: pickupLoc.longitude },
      drop: { lat: dropLoc.latitude, lng: dropLoc.longitude }
    };
    
    this.availableSeats = this.maxCapacity - 1;
  }
}
module.exports = { Ride };
