const { Router } = require('express');
const { ParkingController } = require('../controllers/ParkingController');

const router = Router();

// Reservation System
router.post('/reservations', ParkingController.createReservation);
router.get('/reservations/:id', ParkingController.getReservation);
router.delete('/reservations/:id', ParkingController.cancelReservation);

// Check-in and Check-out Core
router.post('/checkin', ParkingController.checkIn);
router.post('/checkout', ParkingController.checkOut);

// Availability APIs
router.get('/spots', ParkingController.getAllSpots);
router.get('/spots/available', ParkingController.getAvailableSpots);
router.get('/spots/occupied', ParkingController.getOccupiedSpots);

module.exports = router;
