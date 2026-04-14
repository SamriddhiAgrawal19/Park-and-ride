class NotificationService {
  // Simulates Firebase Cloud Messaging (FCM) or Apple Push Notify (APN)
  dispatchRideRequest(drivers, rideDetails) {
    console.log(`[Notification Svc] FCM Dispatching Ride Request ${rideDetails.rideId} to ${drivers.length} drivers.`);
    return true; 
  }

  notifyRider(userId, message) {
    console.log(`[Notification Svc] -> FCM to Rider ${userId}: ${message}`);
  }
  
  notifyDriver(driverId, message) {
    console.log(`[Notification Svc] -> FCM to Driver ${driverId}: ${message}`);
  }
}

module.exports = { NotificationService };
