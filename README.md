# 🚗 Park & Ride System
**Smart Parking & Last-Mile Connectivity Platform**  
*Team: Code Fusion*

---

## 📖 1. Introduction

Urban cities face three major transportation problems:
1. **Traffic congestion**
2. **Unpredictable parking availability**
3. **Last-mile connectivity issues**

The **Park & Ride System** is a unified platform designed to solve these problems by integrating smart parking management with ride-sharing services. 

The platform allows users to:
* **Reserve** parking slots before arrival.
* **Check-in and check-out** through automated ticketing.
* **Book solo or shared rides** to reach their final destinations directly from their parking spot.
* **Pay** for parking and ride services through a unified, idempotent payment system.

By optimizing parking utilization and enabling seamless multi-modal transportation, this backend serves as a scalable solution to the urban mobility crisis.

---

## ✨ 2. Key Features

### 🅿️ Smart Parking Management
* Real-time parking slot visibility.
* Pre-booking of parking spaces.
* Automated ticket generation with QR-code abstraction.
* Dynamic pricing based on vehicle type and duration.

### 🚖 Ride Sharing (Solo & Carpool)
* Booking of Solo Rides.
* Booking of Shared Carpool Rides (`rideType: 'shared'`).
* Real-time ride status lifecycle (`REQUESTED` → `ACCEPTED` → `STARTED` → `COMPLETED`).

### 🧠 Intelligent Matching & Constraints
* **Haversine Distance Algorithm**: Matches closest drivers utilizing geographic coordinate math.
* **Geo-Proximity Driver Search**: Allows bounding constraints (e.g., matching within 1.5km radius).
* **Distributed Locking (Zookeeper)**: Prevents the same driver from being double-booked by concurrent ride requests.
* **Capacity Validation**: Strictly ensures vehicle occupancy is never exceeded during carpools.

### 💳 Payment System
* Unified payment gateway supporting both parking tickets and passenger rides.
* Integrated with Razorpay for secure checkout logic.
* **Idempotent Transactions**: Prevents duplicate billing on network retries.

---

## 🏗️ 3. System Architecture & Tech Stack

This system strictly follows a **Modular Layered Architecture** to guarantee separation of concerns, unit testability, and isolated scaling.

```text
[ Client (Mobile / Web) ]
        │
        ▼
[ API Gateway (Express Router) ]  --> Defines Routes
        │
        ▼
[ Controllers ]  --> Extracts Request Data, Issues HTTP Responses
        │
        ▼
[ Services ] --> Core Business & Orchestration Logic
        │
        ▼
[ Strategies ] --> Design Patterns (Fare Calculation / Pricing)
        │
        ▼
[ Models / DB Layer ] --> Data Objects, Redis Caching, DB Storage
```

### 🛠️ Technology Stack
| Technology | Purpose | Why We Chose This |
| :--- | :--- | :--- |
| **Node.js** | Backend Runtime | Non-blocking, event-driven architecture naturally scales for high I/O operations (concurrent ride requests, constant GPS updates). |
| **Express.js** | REST Framework | Minimalist routing suited for clean API endpoint creation. |
| **MongoDB** | Database | NoSQL document database perfect for storing adaptable schemas like `Ride` and `Ticket` entities. |
| **Redis** | In-Memory Cache | Extremely fast lookups. Used here to store and retrieve active, available drivers. |
| **Zookeeper** | Distributed Lock | Vital for preventing race conditions when two users hail the same nearby driver. |
| **Kafka** | Event Streaming | Handles high-throughput payload streams (like real-time moving coordinates). |
| **Razorpay** | Payment Gateway | Reliable 3rd party processor for local checkout logic. |

---

## 📂 4. Project Folder Structure

```text
src/
├── common/
│   └── utils/ (distanceCalculator.js, logger.js, errors.js)
├── parking/
│   ├── controllers/ (ParkingController.js)
│   ├── models/ (ParkingLot.js, ParkingSpot.js, Ticket.js, Vehicle.js, Reservation.js)
│   ├── routes/ (parkingRoutes.js)
│   ├── services/ (ParkingService.js)
│   └── strategies/ (PricingStrategy.js, PaymentStrategy.js)
├── ride/
│   ├── controllers/ (RideController.js, DriverController.js)
│   ├── models/ (Ride.js, Driver.js, RedisStore.js, PostgresStore.js, ZookeeperLock.js)
│   ├── routes/ (rideRoutes.js)
│   ├── services/ (RideService.js, DriverMatchingService.js, SharedRideMatcher.js)
│   └── strategies/ (FareCalculationStrategy.js)
└── payment/
    ├── controllers/ (paymentController.js)
    ├── models/ (Payment.js)
    └── routes/ (paymentRoutes.js)
```

*(Note: Modules are completely decoupled. The Parking module knows nothing about the Ride module, making microservice extraction trivial).*

---

## 🧩 5. Deep Dive: Parking System Design

The parking system actively manages the supply (Parking Spots) and demand (Vehicles). 

### Core Flow
1. **Reservation**: User books a time window.
2. **Check-in**: System generates a structural spot mapping and active `Ticket`.
3. **Checkout**: Identifies exit time, delegates to a strategy, and calculates fee.
4. **Payment**: Transacts fee and vacates spot.

### 💻 Code Snippet: Check Out & Payment Delegation
*Why this approach?* By decoupling the checkout process from the pricing calculation, we can easily change parking rates (e.g., Weekend vs Weekday) without altering the core checkout physics. 

```javascript
// src/parking/services/ParkingService.js
checkOut(ticketId) {
  const ticket = this.activeTickets.get(ticketId);
  if (!ticket) throw new Error("Ticket not found");

  ticket.exitTime = new Date();
  
  // Strategy Pattern: Dynamically assign pricing logic based on vehicle type
  const fee = this.pricingStrategy.calculateFee(ticket);
  
  // Closes ticket internally calling parkingSpot.vacate()
  ticket.closeTicket(fee); 
  return ticket;
}
```

---

## 🚖 6. Deep Dive: Ride Sharing & Carpool System

This module connects idle drivers to users.

### 💻 Code Snippet: Joining a Shared Ride
*Why this approach?* Supporting carpools lowers urban footprint and costs. However, we must ensure maximum capacity constraints and strict deviation calculations (so existing riders aren't taken on massive detours).

```javascript
// src/ride/services/SharedRideMatcher.js
joinSharedRide(rideId, userId, pickupLoc, dropLoc) {
  const ride = this.postgresStore.getRide(rideId);
  
  // EDGE CASE: Capacity Overflow
  if (ride.availableSeats <= 0) {
      throw new Error('Ride is already full capacity');
  }

  // ALGORITHM: Validate Haversine proximity for pickup vectors
  const validProximity = this.validatePathsIntersect(ride.pickupLoc, pickupLoc);
  if (!validProximity) {
      throw new Error('Detour is too far');
  }

  // Bind to ride
  ride.currentRiders.push({ userId, pickup: pickupLoc, drop: dropLoc });
  ride.availableSeats -= 1;
  return ride;
}
```

### 💻 Code Snippet: Driver Matching & Distributed Locks
*Why this approach?* In a highly concurrent environment (millions of users), two users might hit "Request Ride" simultaneously next to the same driver. If the DB isn't locked, they both get assigned the same car.

```javascript
// src/ride/services/DriverMatchingService.js
findNearbyDrivers(pickupLat, pickupLng, vehicleType) {
  // 1. Fetch available drivers from FAST in-memory Redis cache
  const availableDrivers = this.redisStore.getActiveDriversList();

  // 2. Sort by nearest physically (Haversine Distance)
  availableDrivers.sort((a, b) => a.distance - b.distance);

  const eligibleDrivers = [];
  for (const driver of availableDrivers) {
    // 3. ATTEMPT ZOOKEEPER LOCK
    // This atomic operation prevents concurrent double-booking of a driver
    if (this.zookeeperLock.acquireLock(driver.driverId)) {
      eligibleDrivers.push(driver);
      if (eligibleDrivers.length >= 3) break; // Ping top 3 drivers
    }
  }
  return eligibleDrivers;
}
```

---

## ⚙️ 7. Database Design (ER & Schemas)

By strictly defining the NoSQL structure, we pave the way for heavy geographical queries (`$nearSphere` in MongoDB).

### Database Collections (JSON Schemas)

**Ride Collection**
```javascript
{
  _id: ObjectId,
  driverId: ObjectId,            // Reference to Driver
  rideType: String,              // 'solo' | 'shared'
  status: String,                // 'REQUESTED' | 'ACCEPTED' | 'COMPLETED'
  currentRiders: [{
     userId: ObjectId,
     pickup: { lat, lng },
     drop: { lat, lng }
  }],
  availableSeats: Number
}
```

**Ticket Collection**
```javascript
{
  _id: ObjectId,
  vehicleId: ObjectId,
  spotId: ObjectId,
  entryTime: Date,
  exitTime: Date,
  fee: Number
}
```

### Entity Relationship
```text
[ User ] --(1:N)--> [ Vehicle ]
                       |
                   (1:N)
                       v
                 [ Ticket ] <--(1:1)--> [ Payment ]
                       ^                   |
                       |                 (1:1)
                 [ Parking Spot ]          v
                                        [ Ride ]
```

---

## 🎨 8. Design Patterns Used

Implementing strict Software Engineering Design patterns ensures stability:

1. **Factory Pattern (`VehicleFactory`)**: Creates exact instances of `Car`, `Bike`, or `Truck` ensuring centralized vehicle logic.
2. **Strategy Pattern (`PricingStrategy` & `FareCalculationStrategy`)**: Easily hot-swap pricing formulas based on surge hours, weekend rates, and vehicle tiers without modifying inner service constraints.
3. **Singleton Pattern (`PostgresStore`, `RedisStore`)**: Prevents memory leaks by ensuring the server instantiates exactly one DB connection pool to manage concurrent states.

---

## 🛡️ 9. Edge Case Handling (Why & How)

| Scenario | Handled By | Why it is handled this way |
| :--- | :--- | :--- |
| **Concurrency Collisions** | `ZookeeperLock.js` | Stops the system from assigning 1 driver to 2 discrete callers at the exact same millisecond. |
| **Carpool Overflow** | `availableSeats` attribute | Checks integer counts *before* accepting pushes into arrays. Protects drivers from being cited for overcrowding. |
| **Payment Dropoffs** | Unified Webhooks | If a user closes the Razorpay window but money leaves their bank, Razorpay's asynchronous webhook hits `/api/payment/webhook` to idempotently finalize the database record. |
| **No Parking Found** | Service Exceptions | Immediately kicks out a generic `400 Bad Request` rather than attempting a partial object generation, saving memory overhead. |

---

## 🌐 10. API Documentation Reference

*For full payloads, view Postman environments.*

### Parking APIs (`/api`)
* `POST /reservations` - Reserve a spot.
* `POST /checkin` - Entry validation.
* `POST /checkout` - Exit and compute fee.

### Ride APIs (`/v1/api`)
* `POST /rides/request` - Hail a driver.
* `POST /rides/join-shared` - Join passing carpool.
* `POST /ride/rides` - Driver interface for Accept/Deny.
* `POST /drivers/location` - High frequency pinging of GPS coordinates.

### Payment APIs (`/api/payment`)
* `POST /checkout` - Generate Razorpay processing Order ID.
* `POST /verify` - Confirms cryptographic signature matching.

---

## 🚀 11. Future Scope & Extensibility

If given further runway, the architecture supports:
1. **Real-time WebSockets (Socket.IO)**: Replacing polling mechanisms with active bi-directional streams for visualizing a car moving flawlessly across a mobile map.
2. **Advanced GIS Routing**: Connecting to Google Maps/MapBox to swap our current "Airline-style Haversine Distance" for exact traffic-adjusted ETAs.
3. **Database Migration to Real Shards**: Transitioning the JS `Maps` mocking system to actual `mongoose` schemas connected to a horizontally sharded Atlas cluster.
4. **Dockerization**: Writing a `docker-compose.yaml` to instantly boot Node, Redis, and Zookeeper locally.

---
*Built to scale. Designed for the modern commute.* 🏙️
