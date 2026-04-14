const { Rating } = require('../models/Rating');
const { PostgresStore } = require('../models/PostgresStore');

class RatingService {
  constructor() {
    this.postgresStore = PostgresStore.getInstance();
  }

  submitRating(senderId, receiverId, rideId, score) {
    const ratingObj = new Rating(senderId, receiverId, score, rideId);
    this.postgresStore.saveRating(ratingObj);
    return ratingObj;
  }
}
module.exports = { RatingService };
