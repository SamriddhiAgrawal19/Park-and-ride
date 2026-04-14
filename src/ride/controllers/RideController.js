const { RateFareService } = require('../services/RateFareService');
const { RideService } = require('../services/RideService');
const { RatingService } = require('../services/RatingService');

const rateFareService = new RateFareService();
const rideService = new RideService();
const ratingService = new RatingService();

class RideController {

  static getFareEstimate(req, res, next) {
    try {
      const { pickupLat, pickupLng, dropLat, dropLng, vehicleType, rideType, numRiders } = req.body;
      const estimate = rateFareService.estimateFare(pickupLat, pickupLng, dropLat, dropLng, vehicleType, rideType, numRiders);
      res.status(200).json({ status: 'success', estimate });
    } catch (error) { next(error); }
  }

  static requestRide(req, res, next) {
    try {
      const { userId, pickupLat, pickupLng, dropLat, dropLng, vehicleType, rideType } = req.body;
      const result = rideService.requestRide(userId, pickupLat, pickupLng, dropLat, dropLng, vehicleType, rideType);
      res.status(201).json({ status: 'success', ...result });
    } catch (error) { next(error); }
  }

  static joinSharedRide(req, res, next) {
    try {
      const { rideId } = req.params;
      const { userId, pickupLat, pickupLng, dropLat, dropLng } = req.body;
      const ride = rideService.joinSharedRide(rideId, userId, pickupLat, pickupLng, dropLat, dropLng);
      res.status(200).json({ status: 'success', message: 'Successfully joined shared ride', ride });
    } catch (error) { next(error); }
  }

  static getAvailableSharedRides(req, res, next) {
    try {
      const availableRides = rideService.driverMatchingService.sharedRideMatcher.getAvailableSharedRides();
      res.status(200).json({ status: 'success', availableRides });
    } catch (error) { next(error); }
  }

  static getRideHistory(req, res, next) {
    try {
      const { userId } = req.query; // simulate fetching query params for user
      const history = rideService.getRideHistory(userId);
      res.status(200).json({ status: 'success', history });
    } catch (error) { next(error); }
  }

  static cancelRide(req, res, next) {
    try {
      const { rideId } = req.params;
      const ride = rideService.cancelRide(rideId);
      res.status(200).json({ status: 'success', message: 'Ride cancelled', ride });
    } catch (error) { next(error); }
  }

  static submitRating(req, res, next) {
    try {
      const { rideId } = req.params;
      const { senderId, receiverId, rating } = req.body;
      
      const r = ratingService.submitRating(senderId, receiverId, rideId, rating);
      res.status(201).json({ status: 'success', rating: r });
    } catch (error) { next(error); }
  }

  static startRide(req, res, next) {
    try {
      const { rideId } = req.params;
      const ride = rideService.startRide(rideId);
      res.status(200).json({ status: 'success', message: 'Ride started', ride });
    } catch (error) { next(error); }
  }

  static endRide(req, res, next) {
    try {
      const { rideId } = req.params;
      const ride = rideService.endRide(rideId);
      res.status(200).json({ status: 'success', message: 'Ride ended', ride });
    } catch (error) { next(error); }
  }
}
module.exports = { RideController };
