const { calculateDistance } = require('../../common/utils/distanceCalculator');
const { BikeFareStrategy, CarFareStrategy } = require('../strategies/FareCalculationStrategy');

class RateFareService {
  estimateFare(pickupLat, pickupLng, dropLat, dropLng, vehicleType = 'Car') {
    const distanceKm = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
    
    let strategy;
    if (vehicleType.toLowerCase() === 'bike') {
      strategy = new BikeFareStrategy();
    } else {
      strategy = new CarFareStrategy();
    }

    const estimatedFare = strategy.calculateFare(distanceKm);
    
    return {
      distance: distanceKm.toFixed(2) + ' km',
      vehicleType,
      estimatedFare: Math.round(estimatedFare)
    };
  }
}
module.exports = { RateFareService };
