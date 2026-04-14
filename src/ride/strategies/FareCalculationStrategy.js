class FareCalculationStrategy {
  calculateFare(distanceInKm, durationInMins = 0) {
    throw new Error('Method not implemented');
  }
}

class BikeFareStrategy extends FareCalculationStrategy {
  calculateFare(distanceInKm, durationInMins = 0) {
    return distanceInKm * 20; // Bike = Rs 20/km
  }
}

class CarFareStrategy extends FareCalculationStrategy {
  calculateFare(distanceInKm, durationInMins = 0) {
    return (distanceInKm * 60) + (durationInMins * 1); // Car = Rs 60/km + 1/min waiting
  }
}

class SharedCarFareStrategy extends FareCalculationStrategy {
  calculateFare(distanceInKm, durationInMins = 0, numRiders = 1) {
    const totalFare = (distanceInKm * 60) + (durationInMins * 1);
    // Split fare among riders
    return totalFare / Math.max(numRiders, 1); 
  }
}

module.exports = { FareCalculationStrategy, BikeFareStrategy, CarFareStrategy, SharedCarFareStrategy };
