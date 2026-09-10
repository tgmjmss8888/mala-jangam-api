const mongoose = require("mongoose");

const dashboardDataSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  typeCode: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdDateTime: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("DashboardData", dashboardDataSchema);
