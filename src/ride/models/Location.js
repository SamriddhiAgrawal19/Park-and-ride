class Location {
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.modifiedTS = new Date();
  }
}
module.exports = { Location };
