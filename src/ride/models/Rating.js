class Rating {
  constructor(senderId, receiverId, rating, rideId) {
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.rating = rating;
    this.rideId = rideId;
    this.timestamp = new Date();
  }
}
module.exports = { Rating };
