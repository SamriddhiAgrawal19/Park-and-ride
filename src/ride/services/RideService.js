const { PostgresStore } = require('../models/PostgresStore');
const { Ride } = require('../models/Ride');
const { Location } = require('../models/Location');
const { DriverMatchingService } = require('./DriverMatchingService');
const { RateFareService } = require('./RateFareService');
const { NotificationService } = require('./NotificationService');

class RideService {
  constructor() {
    this.postgresStore = PostgresStore.getInstance();
    this.driverMatchingService = new DriverMatchingService();
    this.rateFareService = new RateFareService();
    this.notificationService = new NotificationService();
  }

  requestRide(userId, pickupLat, pickupLng, dropLat, dropLng, vehicleType) {
    const pickupLoc = new Location(pickupLat, pickupLng);
    const dropLoc = new Location(dropLat, dropLng);
    
    const ride = new Ride(userId, pickupLoc, dropLoc, vehicleType);
    this.postgresStore.saveRide(ride);

    // Matches with Zookeeper locks
    const matchedDrivers = this.driverMatchingService.findNearbyDrivers(pickupLat, pickupLng, vehicleType);
    
    if (matchedDrivers.length === 0) {
      ride.status = 'CANCELLED'; 
      return { ride, message: 'No drivers available nearby' };
    }

    this.notificationService.dispatchRideRequest(matchedDrivers, ride);

    return { 
      ride, 
      message: 'Ride requested successfully. Waiting for driver acceptance.',
      notifiedDrivers: matchedDrivers.map(d => d.driverId)
    };
  }

  acceptRide(rideId, driverId) {
    const ride = this.postgresStore.getRide(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.status !== 'REQUESTED') throw new Error('Ride is no longer available');

    const driver = this.postgresStore.drivers.get(driverId);
    if (!driver) throw new Error('Driver not found');

    ride.driverId = driverId;
    ride.status = 'ACCEPTED';
    driver.status = 'DRIVING';

    // Free the Zookeeper lock since they accepted
    this.driverMatchingService.releaseDriverLock(driverId);

    this.notificationService.notifyRider(ride.userId, `Driver ${driver.name} accepted your ride.`);
    return ride;
  }

  startRide(rideId) {
    const ride = this.postgresStore.getRide(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.status !== 'ACCEPTED') throw new Error('Cannot start ride prior to acceptance');

    ride.status = 'STARTED';
    this.notificationService.notifyRider(ride.userId, 'Your ride has started.');
    return ride;
  }

  endRide(rideId) {
    const ride = this.postgresStore.getRide(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.status !== 'STARTED') throw new Error('Only started rides can be ended');

    const fareDetails = this.rateFareService.estimateFare(
      ride.pickupLoc.latitude, ride.pickupLoc.longitude,
      ride.dropLoc.latitude, ride.dropLoc.longitude,
      ride.vehicleType
    );

    ride.fare = fareDetails.estimatedFare;
    ride.status = 'COMPLETED';

    const driver = this.postgresStore.drivers.get(ride.driverId);
    if (driver) driver.status = 'IDLE';

    this.notificationService.notifyRider(ride.userId, `Ride ended. Please pay Rs ${ride.fare}.`);
    return ride;
  }

  cancelRide(rideId) {
    const ride = this.postgresStore.getRide(rideId);
    if (!ride) throw new Error('Ride not found');
    
    if (ride.driverId) {
      const driver = this.postgresStore.drivers.get(ride.driverId);
      if (driver) driver.status = 'IDLE';
    }
    
    ride.status = 'CANCELLED';
    return ride;
  }
  
  getRideHistory(userId) {
    const history = [];
    for (const [id, ride] of this.postgresStore.rides.entries()) {
      if (ride.userId === userId) {
        history.push(ride);
      }
    }
    return history;
  }
}
module.exports = { RideService };
