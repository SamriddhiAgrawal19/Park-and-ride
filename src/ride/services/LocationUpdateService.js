const { KafkaTripConsumer } = require('../models/KafkaTripConsumer');

class LocationUpdateService {
  constructor() {
    this.kafkaConsumerMock = KafkaTripConsumer.getInstance();
  }

  receiveLocationUpdate(driverId, lat, lng) {
    this.kafkaConsumerMock.consumeLocationUpdate(driverId, lat, lng);
  }
}
module.exports = { LocationUpdateService };
