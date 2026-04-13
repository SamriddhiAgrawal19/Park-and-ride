const { VehicleType } = require('./Vehicle');

class ParkingSpot {
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.isFree = true;
    this.reservations = [];
  }

  isAvailable(startTime, endTime) {
    const s = new Date(startTime).getTime();
    const e = new Date(endTime).getTime();

    if (!this.isFree) return false;

    for (const res of this.reservations) {
      if (res.status === 'ACTIVE') {
        const rs = new Date(res.startTime).getTime();
        const re = new Date(res.endTime).getTime();
        if (s < re && e > rs) {
          return false; // Time conflict
        }
      }
    }
    return true;
  }

  isAvailableForWalkIn() {
    if (!this.isFree) return false;
    const now = new Date().getTime();
    // Cannot allow indefinite walk-in if there are upcoming active reservations
    return !this.reservations.some(r => r.status === 'ACTIVE' && new Date(r.endTime).getTime() > now);
  }

  reserve(reservation) {
    this.reservations.push(reservation);
  }

  park(reservationId = null) {
    if (!this.isFree) throw new Error("Spot is already occupied");
    
    if (reservationId) {
      const res = this.reservations.find(r => r.id === reservationId);
      if (res) res.status = 'FULFILLED';
    }
    
    this.isFree = false;
  }

  vacate() {
    this.isFree = true;
  }
}

class CarSpot extends ParkingSpot {
  constructor(id) {
    super(id, VehicleType.CAR);
  }
}

class BikeSpot extends ParkingSpot {
  constructor(id) {
    super(id, VehicleType.BIKE);
  }
}

class TruckSpot extends ParkingSpot {
  constructor(id) {
    super(id, VehicleType.TRUCK);
  }
}

module.exports = { ParkingSpot, CarSpot, BikeSpot, TruckSpot };
