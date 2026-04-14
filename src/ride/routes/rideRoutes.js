const { Router } = require('express');
const { RideController } = require('../controllers/RideController');
const { DriverController } = require('../controllers/DriverController');

const router = Router();

// --- User APIs ---
router.post('/api/fare', RideController.getFareEstimate);
router.post('/api/rides/request', RideController.requestRide);

// Shared Ride Specific Endpoints
router.get('/api/ride/available-shared', RideController.getAvailableSharedRides);
router.post('/api/ride/join/:rideId', RideController.joinSharedRide);

router.get('/api/rides/history', RideController.getRideHistory);
router.post('/api/rides/:rideId/cancel', RideController.cancelRide);
router.post('/api/rides/:rideId/ratings', RideController.submitRating);

// --- Driver APIs ---
// Location updates
router.post('/drivers/location', DriverController.updateLocation);
// Accept/Deny
router.post('/api/ride/rides', DriverController.acceptOrDenyRide);
// Manage Trip
router.post('/api/ride/:rideId/start', RideController.startRide);
router.post('/api/ride/:rideId/end', RideController.endRide);

module.exports = router;
