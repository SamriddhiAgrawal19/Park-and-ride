const { Router } = require('express');
const { ParkingController } = require('../controllers/ParkingController');

const router = Router();

router.post('/park', ParkingController.park);
router.post('/exit', ParkingController.exit);
router.get('/spots', ParkingController.getAllSpots);
router.get('/available', ParkingController.getAvailableSpots);

module.exports = router;
