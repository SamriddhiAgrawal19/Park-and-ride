const { LocationUpdateService } = require('../services/LocationUpdateService');
const { RideService } = require('../services/RideService');

const locationUpdateService = new LocationUpdateService();
const rideService = new RideService();

class DriverController {
  // POST: /v1/drivers/location {body:Lat, Long}
  static updateLocation(req, res, next) {
    try {
      // Basic mock authentication: get driverId from header or body
      const { driverId, latitude, longitude } = req.body;
      if (!driverId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ status: 'error', message: 'Missing fields' });
      }
      locationUpdateService.receiveLocationUpdate(driverId, latitude, longitude);
      res.status(200).json({ status: 'success', message: 'Location updated' });
    } catch (error) { next(error); }
  }

  // POST: /v1/api/ride/rides {body: requestId, accept}
  static acceptOrDenyRide(req, res, next) {
    try {
      const { driverId, rideId, accept } = req.body;
      if (!driverId || !rideId) {
        return res.status(400).json({ status: 'error', message: 'Missing driverId or rideId' });
      }
      
      if (accept) {
        const ride = rideService.acceptRide(rideId, driverId);
        res.status(200).json({ status: 'success', message: 'Ride accepted', ride });
      } else {
        // Just release the lock if denied
        rideService.driverMatchingService.releaseDriverLock(driverId);
        res.status(200).json({ status: 'success', message: 'Ride denied' });
      }
    } catch (error) { next(error); }
  }
}
module.exports = { DriverController };
