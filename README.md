# Park & Ride System: Smart Parking & Last-Mile Connectivity

## 1. Introduction
The **Park & Ride System** is an integrated backend platform designed to solve modern urban mobility challenges. Urban congestion, the lack of predictable parking, and last-mile connectivity gaps heavily impact daily commuters. This system provides a unified solution: allowing users to pre-book parking slots, smoothly check-in/out via an automated ticketing system, and instantly book single or shared rides (cabs/bikes) to reach their final destination. 

### Key Features
- **Smart Parking Management:** Real-time visibility, pre-reservations, and seamless check-in/out ticketing.
- **Dynamic Ride-Sharing:** Support for both solo and shared rides (carpooling).
- **Driver Orchestration:** Geolocation-based matching using the Haversine formula and Zookeeper-style TTL locking to prevent race conditions.
- **Fair Pricing:** Dynamic Fare Calculation and Strategy patterns for flexible payments.

---

## 2. Tech Stack & Justification

- **Node.js**: Provides a non-blocking, event-driven architecture that naturally scales well for high I/O operations like concurrent ride requests and parking updates.
- **Express.js**: A minimalist web framework perfectly suited for crafting clean RESTful APIs.
- **In-Memory Storage (Current)**: Utilized JavaScript `Map`s for radically fast prototyping and instantaneous state testing.
- **MongoDB (Future DB)**: A NoSQL document database designed to adapt flexibly to evolving schemas (ideal for complex `Ride` and `Ticket` entities).
- **JSON Web Tokens (JWT) & Razorpay**: For authentication and unified payment processing (parking + ride payments).

---

## 3. System Architecture

The backend strictly adheres to a **Modular Layered Architecture** to enforce separation of concerns and maintain testability.

```text
[ Client (Mobile/Web) ]
       │
[ API Routes (Express Router) ] ──────> Defines HTTP endpoints
       │
[ Controllers ] ──────> Extracts request data, calls services, sends HTTP responses
       │
[ Services ] ─────────> Contains core business logic and orchestration
       │
[ Strategies ] ───────> Encapsulates interchangeable algorithms (Pricing, Fares)
       │
[ Models (Data layer) ] ──> Data structure definitions and persistence interactions
```

---

## 4. Parking System Design

The parking system effectively matches incoming vehicles to appropriate parking slots.

### Entities
`Vehicle`, `ParkingSpot`, `ParkingLot`, `Ticket`, `Reservation`

### Core Flows
- **Reservation:** A user explicitly books a window.
- **Check-in:** The system assigns an active structural spot and generates an active `Ticket`. 
- **Check-out:** Identifies exit time and delegates to pricing algorithms to capture the final fee.
- **Payment:** Resolves the ticket fee and vacates the spot.

### Code Snippets
```javascript
// Check In Flow
parkVehicle(vehicleOptions) {
  const vehicle = VehicleFactory.createVehicle(vehicleOptions);
  const availableSpot = this.findAvailableSpot(vehicle.type);
  if (!availableSpot) throw new Error("Lot is fully occupied");

  availableSpot.park();
  const ticket = new Ticket(generateId(), vehicle, availableSpot);
  this.activeTickets.set(ticket.id, ticket);
  return ticket;
}

// Check Out Flow
checkOut(ticketId) {
  const ticket = this.activeTickets.get(ticketId);
  const fee = this.pricingStrategy.calculateFee(ticket);
  ticket.closeTicket(fee); // internally calls parkingSpot.vacate()
  return ticket;
}
```

---

## 5. Ride-Sharing System Design

Seamlessly transitions a parked user to an active commuter. 

### Core Mechanics
- **Lifecycle:** `REQUESTED` → `ACCEPTED` → `STARTED` → `COMPLETED`
- **Driver Matching:** Filters idle drivers based on requested vehicle types and ranks them via proximity.
- **Locking:** Applies TTL logic indicating that a driver is uniquely locked to an incoming request to avoid double-booking.

### Shared Rides
Enables up to 4 users to carpool in a single car. 
- **rideType:** Toggles between `'solo'` and `'shared'`.
- **Matching:** Actively compares directional vectors (Haversine distances for pickups <= 1.5km, drops <= 2km).
- **Joining:** Updates `availableSeats` directly.

```javascript
// Joining a shared ride snippet
joinSharedRide(rideId, userId, pickupLoc, dropLoc) {
  const ride = this.store.getRide(rideId);
  if (ride.availableSeats <= 0) throw new Error('Ride is already full capacity');
  
  ride.currentRiders.push({ userId, pickup: pickupLoc, drop: dropLoc });
  ride.availableSeats -= 1;
  return ride;
}
```

---

## 6. API Design

### Parking APIs

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/park` | `{ type: "Car", licensePlate: "XX-XX" }` | Walk-in assignment. Returns `Ticket` |
| POST | `/reserve` | `{ userId, type, startTime, endTime }` | Pre-books a parking spot. |
| POST | `/checkin` | `{ reservationId }` | Validates booking, returns entry `Ticket`|
| POST | `/checkout` | `{ ticketId }` | Releases spot & calculates base fee. |

### Ride Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/ride/request` | `{ userId, pickupLat, pickupLng, dropLat, dropLng, vehicleType, rideType }` | Matches a driver / Creates ride |
| POST | `/ride/join/:rideId` | `{ userId, pickupLat, pickupLng, dropLat, dropLng }` | Joins existing carpool |
| GET | `/ride/available-shared`| _None_ (Query: lat, lng) | Browses open shared rides |

---

## 7. Database Design & Schema (MongoDB)

To safely map the in-memory models to a production MongoDB cluster:

### Indexes
- **Geospatial Indexes:** `2dsphere` on location attributes (Pickup/Drop).
- **Compound Indexes:** `{ status: 1, vehicleType: 1 }` for driver filtering.

#### User
* **_id**: ObjectId
* **name**: String
* **email**: String

#### Vehicle
* **_id**: ObjectId
* **userId**: ObjectId (ref User)
* **type**: String (`ENUM: 'Car', 'Bike'`)
* **licensePlate**: String

#### Ride
* **_id**: ObjectId
* **rideType**: String (`'solo', 'shared'`)
* **currentRiders**: Array of Objects `[{ userId, pickup: {lat, lng}, drop: {lat, lng} }]`
* **maxCapacity**: Number
* **availableSeats**: Number
* **driverId**: ObjectId (ref User/Driver)
* **status**: String (`'REQUESTED', 'ACCEPTED', 'COMPLETED'`)

#### Reservation
* **_id**: ObjectId
* **userId**: ObjectId (ref User)
* **spotId**: ObjectId (ref ParkingSpot)
* **startTime**: Date
* **endTime**: Date
* **status**: String

#### Ticket
* **_id**: ObjectId
* **vehicleId**: ObjectId (ref Vehicle)
* **spotId**: ObjectId (ref ParkingSpot)
* **entryTime**: Date
* **exitTime**: Date (nullable)
* **fee**: Number

#### Payment (Unified)
* **_id**: ObjectId
* **referenceId**: ObjectId (refs Ticket OR Ride)
* **purpose**: String (`'parking', 'ride'`)
* **amount**: Number
* **status**: String (`'success', 'failed'`)
* **method**: String (`'razorpay'`)

---

## 8. Design Patterns Used

1. **Factory Pattern:** Used heavily for generating concrete representations of `Vehicle`s (`Car`, `Bike`, `Truck`) ensuring centralized creation logic. 
2. **Strategy Pattern:** Dictates variable pricing mechanisms. `FareCalculationStrategy` gracefully processes differing logic for `BikeFareStrategy`, `CarFareStrategy`, and `SharedCarFareStrategy`.
3. **Singleton Pattern:** Used in DB/Store classes (`PostgresStore.getInstance()`) guaranteeing absolute synchronization regarding currently allocated slots and ongoing rides in memory.

---

## 9. Algorithms & Core Logic

- **Haversine Formula:** Allows the backend to calculate the great-circle distance between two locations over the Earth's surface utilizing mere latitudes and longitudes. 
- **Driver Matching:** Filters idle drivers based on spatial proximity matching the user. Iterates sorted outcomes attempting an atomic Zookeeper locking protocol to assign the driver.
- **Shared Ride Logic:** Rapidly searches existing `ACTIVE` rides mapping overlapping trajectories (Pickup bounds <= 1.5km, Drop bounds <= 2km).
- **Fare Division:** `SharedCarFareStrategy` determines the net time/distance cost and uniformly divides it by the total `numRiders`.

---

## 10. Edge Case Handling

- **No parking spots available:** Throws a 400 Bad Request exception dynamically aborting partial assignments and alerting the client UI instantly.
- **Driver Collision (Double Bookings):** Employs distributed `ZookeeperLock.js` to ensure the same Driver is not simultaneously matched to independent ride requests.
- **Ride Full:** `availableSeats` natively stops overflow routing. `if (ride.availableSeats <= 0) throw new Error(...)`.
- **Payment Idempotency:** The Unified `PaymentService` enforces duplicate rejection by checking MongoDB's unique `transactionId` references.

---

## 11. Class Diagram (LLD)

```text
  [ VehicleFactory ] ──> creates ──> [ Vehicle ] <|-- [ Car, Bike, Truck ]
                                         │
                                         v
  [ Ticket ] <------- tracks ------- [ ParkingSpot ] <|-- [ CarSpot, BikeSpot ]
      │                                  ^
 [ Payment ]                             | (reserved by)
      │                                  v
  [ Ride ] <--------- matches ------ [ Reservation ]
      │
 (owns)
 [ currentRiders: {userId, pickup, drop} ]
```

---

## 12. ER Diagram (Database Relationships)

```text
+-----------+        1:N       +----------+
|  User     | ───────────────> | Vehicle  |
+-----------+                  +----------+
      │
      │ 1:N
      v
+-------------+      N:1       +---------------+
| Reservation | <───────────── | ParkingSpot   |
+-------------+                +---------------+
                                      │
                                      │ 1:1
+-----------+                         v
| Payment   | <─────── 1:1 ──  +---------------+
+-----------+                  |    Ticket     |
      ▲                        +---------------+
      │
      │ 1:1
+-----------+
|   Ride    |
+-----------+
| Riders[ ] | (Many-to-Many logical relation inside array)
+-----------+
```

---

## 13. System Flow Diagrams

### 1) Ride Flow
```text
REQUEST --> Match Driver via Haversine --> Zookeeper Lock Driver
        --> Driver Accepts --> Status 'ACCEPTED' --> Notify User
        --> Driver En-Route --> Status 'STARTED'
        --> Reaches Destination --> 'COMPLETED' --> Generate Payment URL
```

### 2) Shared Ride Flow
```text
Rider Requests Join --> Validate `availableSeats` > 0
                    --> Assert `rideType` == 'shared'
                    --> Check Proximity (pickup <= 1.5km, drop <= 2.0km)
                    --> Add rider to Ride.currentRiders
                    --> Subtract `availableSeats` 
                    --> Success Response
```

---

## 14. Trade-offs & Design Decisions

- **In-Memory vs Database:** Using standard ES6 Maps provided tremendous speed during prototype orchestration but loses data upon server restarts. Transitioning to MongoDB solves persistence. 
- **Simplicity vs Optimal Ride Paths:** Current matching validates bounded distances relative to the original rider's location. Future iterations would require dynamic TSP (Traveling Salesperson Problem) graphs matching route geometries to avoid severe path deviations.
- **Fare Splitting:** Simplistic fractional division was chosen for shared rides instead of exact leg-by-leg contribution tracking to minimize computational overhead.

---

## 15. Future Improvements

1. **MongoDB Integrations:** Exchanging memory Maps for `mongoose` schemas.
2. **WebSockets (Socket.IO):** Upgrading the current Notification API from localized logging directly into real-time pub/sub driver tracking sockets.
3. **Advanced GIS Routing:** Connect with Google Maps API/Mapbox for ETA calculations enforcing true traffic-based heuristics vs line-of-sight Haversine data.
4. **Dockerization:** Containerize Node and Redis configurations for cloud deployments.

---

## 16. Screenshots / Demo

*(Add Real-World Implementations)*
- `[Screenshot_1: Postman Checkout Ticket Assignment]`
- `[Screenshot_2: MongoDB Cluster View reflecting Razorpay Order]`
- `[Screenshot_3: Ride-Share Frontend UI with Socket real-time moving car]`

---

## 17. Conclusion
The **Park & Ride** architecture stands as a robust, highly extensible backend mirroring the complexity found in Tier-1 logistics companies. By relying heavily on Object-Oriented design strategies, dynamic mapping services, strict payment idempotency, and intelligent spatial orchestration, it proves to be technically scalable and resilient. 

It forms the foundational layer needed for fully addressing the rapidly expanding multi-modal transport market. 
