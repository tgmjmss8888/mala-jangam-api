const mongoose = require("mongoose");

const usersCountSchema = new mongoose.Schema({
  numberOfUsers: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, { timestamps: true });

module.exports = mongoose.model("UsersCount", usersCountSchema);
