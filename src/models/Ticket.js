const TicketStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED'
};

class Ticket {
  constructor(id, vehicle, parkingSpot, entryTime = new Date()) {
    this.id = id;
    this.vehicle = vehicle;
    this.parkingSpot = parkingSpot;
    this.entryTime = entryTime;
    this.exitTime = null;
    this.fee = 0;
    this.status = TicketStatus.ACTIVE;
  }

  closeTicket(fee) {
    this.exitTime = new Date();
    this.fee = fee;
    this.status = TicketStatus.COMPLETED;
    this.parkingSpot.vacate();
  }
}

module.exports = { Ticket, TicketStatus };
