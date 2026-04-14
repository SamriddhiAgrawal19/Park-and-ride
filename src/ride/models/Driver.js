const { Location } = require('./Location');

class Driver {
  constructor(id, name, vehicleType, latitude, longitude) {
    this.driverId = id;
    this.name = name;
    this.vehicleInfo = vehicleType; // 'Bike' or 'Car'
    this.status = 'IDLE'; // IDLE, DRIVING, OFFLINE
    this.rating = 5.0;
    this.location = new Location(latitude, longitude);
  }

  updateLocation(lat, lng) {
    this.location.latitude = lat;
    this.location.longitude = lng;
    this.location.modifiedTS = new Date();
  }
}
module.exports = { Driver };
