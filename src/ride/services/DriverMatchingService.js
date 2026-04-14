const { PostgresStore } = require('../models/PostgresStore');
const { RedisStore } = require('../models/RedisStore');
const { ZookeeperLock } = require('../models/ZookeeperLock');
const { calculateDistance } = require('../../common/utils/distanceCalculator');
const { SharedRideMatcher } = require('./SharedRideMatcher');

class DriverMatchingService {
  constructor() {
    this.postgresStore = PostgresStore.getInstance();
    this.redisStore = RedisStore.getInstance();
    this.zookeeperLock = ZookeeperLock.getInstance();
    this.sharedRideMatcher = new SharedRideMatcher();
  }

  findNearbyDrivers(pickupLat, pickupLng, vehicleType) {
    // 1. Get online drivers from Redis
    const activeDrivers = this.redisStore.getActiveDriversList(this.postgresStore.drivers);
    
    // 2. Filter by status and vehicle matching
    const availableDrivers = activeDrivers.filter(d => 
      d.status === 'IDLE' && 
      d.vehicleInfo.toLowerCase() === vehicleType.toLowerCase()
    );

    // 3. Compute distance (Geohash simulation)
    availableDrivers.forEach(d => {
      d.distanceFromPickup = calculateDistance(pickupLat, pickupLng, d.location.latitude, d.location.longitude);
    });

    // 4. Sort by nearest
    availableDrivers.sort((a, b) => a.distanceFromPickup - b.distanceFromPickup);

    // 5. Try to acquire lock from Zookeeper to guarantee strong consistency on assignments
    const eligibleDrivers = [];
    for (const driver of availableDrivers) {
      if (this.zookeeperLock.acquireLock(driver.driverId)) {
        eligibleDrivers.push(driver);
        // Only return top 3 closest
        if (eligibleDrivers.length >= 3) break;
      }
    }

    return eligibleDrivers;
  }

  releaseDriverLock(driverId) {
    this.zookeeperLock.releaseLock(driverId);
  }
}
module.exports = { DriverMatchingService };
