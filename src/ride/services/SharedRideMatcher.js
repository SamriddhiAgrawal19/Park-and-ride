const { calculateDistance } = require('../../common/utils/distanceCalculator');
const { PostgresStore } = require('../models/PostgresStore');

class SharedRideMatcher {
  constructor() {
    this.postgresStore = PostgresStore.getInstance();
  }

  /**
   * Matches a rider with an existing Shared Ride based on proximity 
   * and directional bounds. 
   */
  findMatchingSharedRide(pickupLat, pickupLng, dropLat, dropLng) {
    const rides = Array.from(this.postgresStore.rides.values());

    let bestMatch = null;
    let minPickupDistance = Infinity;

    for (const ride of rides) {
      if (ride.rideType === 'shared' && 
          ride.availableSeats > 0 && 
          (ride.status === 'REQUESTED' || ride.status === 'ACCEPTED')) {
        
        const pickupDistance = calculateDistance(
          pickupLat, pickupLng, 
          ride.routeDetails.pickup.lat, ride.routeDetails.pickup.lng
        );
        
        const dropDistance = calculateDistance(
          dropLat, dropLng, 
          ride.routeDetails.drop.lat, ride.routeDetails.drop.lng
        );

        // Matching conditions defined in PRD
        if (pickupDistance <= 1.5 && dropDistance <= 2.0) {
          if (pickupDistance < minPickupDistance) {
            minPickupDistance = pickupDistance;
            bestMatch = ride;
          }
        }
      }
    }
    return bestMatch;
  }

  getAvailableSharedRides() {
    const rides = Array.from(this.postgresStore.rides.values());
    return rides.filter(ride => 
      ride.rideType === 'shared' && 
      ride.availableSeats > 0 && 
      (ride.status === 'REQUESTED' || ride.status === 'ACCEPTED')
    );
  }
}

module.exports = { SharedRideMatcher };
