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

  requestRide(userId, pickupLat, pickupLng, dropLat, dropLng, vehicleType, rideType = 'solo') {
    if (rideType === 'shared' && vehicleType.toLowerCase() !== 'car') {
      throw new Error('Shared rides are only available for Car');
    }

    const pickupLoc = new Location(pickupLat, pickupLng);
    const dropLoc = new Location(dropLat, dropLng);

    // 1. If Shared ride, Try to find a matching existing ride first!
    if (rideType === 'shared') {
      const existingRide = this.driverMatchingService.sharedRideMatcher.findMatchingSharedRide(pickupLat, pickupLng, dropLat, dropLng);
      
      // 2. If match found, add rider to it
      if (existingRide) {
        if (existingRide.currentRiders.find(r => r.userId === userId)) {
          throw new Error('Rider is already part of this ride');
        }
        
        existingRide.currentRiders.push({ userId, pickup: pickupLoc, drop: dropLoc });
        existingRide.availableSeats -= 1;
        
        return { 
          ride: existingRide, 
          message: 'Matched and joined an existing shared ride!',
          notifiedDrivers: [] 
        };
      }
    }

    // 3. Else, Create a new Ride
    const ride = new Ride(userId, pickupLoc, dropLoc, vehicleType, rideType);
    this.postgresStore.saveRide(ride);

    // and Match Driver using existing logic
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

  joinSharedRide(rideId, userId, pickupLat, pickupLng, dropLat, dropLng) {
    const ride = this.postgresStore.getRide(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.rideType !== 'shared') throw new Error('Cannot join a solo ride');
    if (ride.availableSeats <= 0) throw new Error('Ride is already full capacity');
    if (ride.currentRiders.find(r => r.userId === userId)) throw new Error('Rider already in the ride');
    
    ride.currentRiders.push({ userId, pickup: new Location(pickupLat, pickupLng), drop: new Location(dropLat, dropLng) });
    ride.availableSeats -= 1;
    
    return ride;
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

    // Notify all riders
    ride.currentRiders.forEach(r => {
        this.notificationService.notifyRider(r.userId, `Driver ${driver.name} accepted your ride.`);
    });
    return ride;
  }

  startRide(rideId) {
    const ride = this.postgresStore.getRide(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.status !== 'ACCEPTED') throw new Error('Cannot start ride prior to acceptance');

    ride.status = 'STARTED';
    ride.currentRiders.forEach(r => {
        this.notificationService.notifyRider(r.userId, 'Your ride has started.');
    });
    return ride;
  }

  endRide(rideId) {
    const ride = this.postgresStore.getRide(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.status !== 'STARTED') throw new Error('Only started rides can be ended');

    const numRiders = ride.currentRiders.length;
    
    // Estimate fare for the ride
    const fareDetails = this.rateFareService.estimateFare(
      ride.pickupLoc.latitude, ride.pickupLoc.longitude,
      ride.dropLoc.latitude, ride.dropLoc.longitude,
      ride.vehicleType,
      ride.rideType,
      numRiders
    );

    ride.fare = fareDetails.estimatedFare;
    ride.status = 'COMPLETED';

    const driver = this.postgresStore.drivers.get(ride.driverId);
    if (driver) driver.status = 'IDLE';

    ride.currentRiders.forEach(r => {
        this.notificationService.notifyRider(r.userId, `Ride ended. Please pay Rs ${ride.fare}.`);
    });
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
      if (ride.currentRiders.find(r => r.userId === userId)) {
        history.push(ride);
      }
    }
    return history;
  }
}
module.exports = { RideService };
