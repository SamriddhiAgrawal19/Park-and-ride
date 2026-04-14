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

module.exports = { FareCalculationStrategy, BikeFareStrategy, CarFareStrategy };
