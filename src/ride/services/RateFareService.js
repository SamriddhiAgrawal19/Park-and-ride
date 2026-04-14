const { calculateDistance } = require('../../common/utils/distanceCalculator');
const { BikeFareStrategy, CarFareStrategy, SharedCarFareStrategy } = require('../strategies/FareCalculationStrategy');

class RateFareService {
  estimateFare(pickupLat, pickupLng, dropLat, dropLng, vehicleType = 'Car', rideType = 'solo', numRiders = 1) {
    const distanceKm = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
    
    let strategy;
    if (rideType === 'shared' && vehicleType.toLowerCase() === 'car') {
      strategy = new SharedCarFareStrategy();
    } else if (vehicleType.toLowerCase() === 'bike') {
      strategy = new BikeFareStrategy();
    } else {
      strategy = new CarFareStrategy();
    }

    const estimatedFare = strategy.calculateFare(distanceKm, 0, numRiders);
    
    return {
      distance: distanceKm.toFixed(2) + ' km',
      vehicleType,
      rideType,
      estimatedFare: Math.round(estimatedFare)
    };
  }
}
module.exports = { RateFareService };
