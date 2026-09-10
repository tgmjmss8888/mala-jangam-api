const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdDateTime: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Rating", ratingSchema);
