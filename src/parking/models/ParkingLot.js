const { BikeSpot, CarSpot, TruckSpot } = require('./ParkingSpot');

class ParkingLot {
  constructor() {
    this.spots = [];
    this.tickets = new Map();
    this.reservations = new Map();
    this.initializeSpots();
  }

  static getInstance() {
    if (!ParkingLot.instance) {
      ParkingLot.instance = new ParkingLot();
    }
    return ParkingLot.instance;
  }

  initializeSpots() {
    for (let i = 1; i <= 10; i++) this.spots.push(new BikeSpot(`B${i}`));
    for (let i = 1; i <= 20; i++) this.spots.push(new CarSpot(`C${i}`));
    for (let i = 1; i <= 5; i++) this.spots.push(new TruckSpot(`T${i}`));
  }

  getAvailableSpotForWalkIn(type) {
    return this.spots.find(spot => spot.type === type && spot.isAvailableForWalkIn()) || null;
  }

  getAvailableSpotForReservation(type, startTime, endTime) {
    return this.spots.find(spot => spot.type === type && spot.isAvailable(startTime, endTime)) || null;
  }

  addReservation(reservation) {
    this.reservations.set(reservation.id, reservation);
  }

  getReservation(id) {
    return this.reservations.get(id);
  }

  getAvailableSpots() {
    return this.spots.filter(spot => spot.isFree);
  }

  getOccupiedSpots() {
    return this.spots.filter(spot => !spot.isFree);
  }

  getSpotById(id) {
    return this.spots.find(spot => spot.id === id) || null;
  }

  addTicket(ticket) {
    this.tickets.set(ticket.id, ticket);
  }

  getTicket(ticketId) {
    return this.tickets.get(ticketId);
  }

  getAllSpots() {
    return this.spots;
  }
}

module.exports = { ParkingLot };
