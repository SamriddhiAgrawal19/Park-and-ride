class ZookeeperLock {
  constructor() {
    this.locks = new Map(); // driverId -> lock expiry timestamp
  }

  static getInstance() {
    if (!ZookeeperLock.instance) {
      ZookeeperLock.instance = new ZookeeperLock();
    }
    return ZookeeperLock.instance;
  }

  // Simulating consistent matching lock
  acquireLock(driverId) {
    const lockExpires = this.locks.get(driverId);
    if (lockExpires && lockExpires > Date.now()) {
      return false; // Driver currently locked parsing another request
    }
    // Lock for 10 seconds
    this.locks.set(driverId, Date.now() + 10000); 
    return true;
  }

  releaseLock(driverId) {
    this.locks.delete(driverId);
  }
}
module.exports = { ZookeeperLock };
