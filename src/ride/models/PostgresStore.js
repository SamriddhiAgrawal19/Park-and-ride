const { Driver } = require('./Driver');

class PostgresStore {
  constructor() {
    this.rides = new Map();
    this.drivers = new Map();
    this.ratings = new Map();
    this.initializeMockDrivers();
  }

  static getInstance() {
    if (!PostgresStore.instance) {
      PostgresStore.instance = new PostgresStore();
    }
    return PostgresStore.instance;
  }

  initializeMockDrivers() {
    const d1 = new Driver('d1', 'Ramesh', 'Car', 28.5355, 77.3910);
    const d2 = new Driver('d2', 'Suresh', 'Bike', 28.5360, 77.3920);
    const d3 = new Driver('d3', 'Mukesh', 'Car', 28.5400, 77.3950);
    this.drivers.set(d1.driverId, d1);
    this.drivers.set(d2.driverId, d2);
    this.drivers.set(d3.driverId, d3);
  }

  saveRide(ride) {
    this.rides.set(ride.rideId, ride);
  }

  getRide(rideId) {
    return this.rides.get(rideId);
  }

  saveRating(rating) {
    this.ratings.set(`${rating.rideId}-${rating.senderId}`, rating);
  }
}
module.exports = { PostgresStore };
