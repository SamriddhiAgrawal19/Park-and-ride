class RedisStore {
  constructor() {
    this.activeDrivers = new Map(); // driverId -> last ping timestamp
  }

  static getInstance() {
    if (!RedisStore.instance) {
      RedisStore.instance = new RedisStore();
    }
    return RedisStore.instance;
  }

  setActive(driverId) {
    this.activeDrivers.set(driverId, Date.now());
  }

  getActiveDriversList(postgresStoreDrivers) {
    const list = [];
    const now = Date.now();
    // Simulate TTL timeout if no ping for 60 seconds
    for (const [id, lastPing] of this.activeDrivers.entries()) {
      if (now - lastPing < 60000) {
        list.push(postgresStoreDrivers.get(id));
      } else {
        this.activeDrivers.delete(id);
      }
    }
    return list;
  }
}
module.exports = { RedisStore };
