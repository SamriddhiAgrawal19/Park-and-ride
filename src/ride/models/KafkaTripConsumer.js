const { PostgresStore } = require('./PostgresStore');
const { RedisStore } = require('./RedisStore');

class KafkaTripConsumer {
  constructor() {
    this.postgresStore = PostgresStore.getInstance();
    this.redisStore = RedisStore.getInstance();
  }

  static getInstance() {
     if (!KafkaTripConsumer.instance) {
       KafkaTripConsumer.instance = new KafkaTripConsumer();
     }
     return KafkaTripConsumer.instance;
  }

  consumeLocationUpdate(driverId, lat, lng) {
    const driver = this.postgresStore.drivers.get(driverId);
    if (!driver) {
      console.error(`TripUpdateConsumer: Location update for unknown driver ${driverId}`);
      return;
    }
    driver.updateLocation(lat, lng);
    this.redisStore.setActive(driverId); // Ping active driver status TTL
  }
}
module.exports = { KafkaTripConsumer };
