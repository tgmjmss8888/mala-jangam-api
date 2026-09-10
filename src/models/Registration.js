// Registration model
const mongoose = require("mongoose");

const childSchema = new mongoose.Schema({
  name: String,
  qualification: String,
  aadhaar: String
}, { _id: false });

const registrationSchema = new mongoose.Schema({

  registrationId: {
    type: String,
    unique: true,
    required: true
  },

  firstName: String,
  middleName: String,
  lastName: String,

  gender: String,
  dob: String,
  age: String,

  maritalStatus: String,
  mobile: String,
  alternateMobile: String,

  email: String,
  aadhaar: String,
  fatherAadhaar: String,
  motherAadhaar: String,
  spouseAadhaar: String,
  subCaste: String,
  rationCardNo: String,
  spouseName: String,
  spouseOccupation: String,

  numberOfChildren: Number,
  children: [childSchema],

  jobDescription: String,

  fatherName: String,
  fatherOccupation: String,
  motherName: String,
  motherOccupation: String,

  houseNo: String,
  street: String,
  city: String,
  district: String,

  mandal: String,
  village: String,

  qualification: String,
  course: String,

  document: String,

  documentId: {
    type: mongoose.Schema.Types.Mixed
  },

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING"
  }

}, { timestamps: true });

module.exports = mongoose.model("Registration", registrationSchema);