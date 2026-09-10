const mongoose = require("mongoose");

const registrationCounter = new mongoose.Schema({
  _id: { type: String, required: true }, // name of the sequence
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model("RegistrationCounter", registrationCounter);

