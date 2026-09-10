// Registration repository
const Registration = require("../models/Registration");
const { isValidAadhaar } = require("../utils/aadhaar");
const Rating = require("../models/Rating");
const DashboardData = require("../models/DashboardData");
const UsersCount = require("../models/UsersCount");
const RegistrationCounter = require("../models/RegistrationCounter");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const MobileVerification = require("../models/MobileVerfication");
class RegistrationRepository {
  sanitizeRegistrationUpdate(data, { publicEdit = false } = {}) {
    const allowedFields = [
      "firstName",
      "middleName",
      "lastName",
      "gender",
      "dob",
      "age",
      "maritalStatus",
      "mobile",
      "alternateMobile",
      "email",
      "aadhaar",
      "subCaste",
      "rationCardNo",
      "fatherName",
      "fatherOccupation",
      "fatherAadhaar",
      "motherName",
      "motherOccupation",
      "motherAadhaar",
      "houseNo",
      "spouseName",
      "spouseOccupation",
      "spouseAadhaar",
      "numberOfChildren",
      "children",
      "street",
      "city",
      "district",
      "mandal",
      "village",
      "qualification",
      "course",
      "jobDescription",
      "documentId",
      "document",
      "status",
    ];

    const payload = {};
    allowedFields.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        payload[key] = data[key];
      }
    });

    if (publicEdit) {
      delete payload.mobile;
      delete payload.email;
    }

    return payload;
  }

  async validateRegistration(data, { publicEdit = false, existingRecord = null } = {}) {
    const errors = [];
    const payload = data || {};

    if (publicEdit) {
      if (
        !payload.mobileVerficationToken ||
        !(await this.validatedToken(payload.mobileVerficationToken, existingRecord?.mobile || payload.mobile))
      ) {
        errors.push("Mobile number verification failed.");
      }
    }

    if (!payload.firstName || !payload.lastName)
      errors.push("First name and last name are required.");

    if (!payload.gender)
      errors.push("Gender is required.");

    if (!payload.dob)
      errors.push("Date of birth is required.");

    if (payload.mobile && !/^[0-9]{10}$/.test(payload.mobile))
      errors.push("Valid 10-digit mobile number is required.");

    if (!publicEdit && !payload.mobile)
      errors.push("Valid 10-digit mobile number is required.");

    if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email))
      errors.push("Valid email is required.");

    if (!payload.aadhaar || !isValidAadhaar(payload.aadhaar))
      errors.push("Aadhaar must be a valid 12-digit Aadhaar number.");

    if (!payload.district || !String(payload.district).trim())
      errors.push("District is required.");

    if (payload.fatherAadhaar && !isValidAadhaar(payload.fatherAadhaar))
      errors.push("Father Aadhaar must be a valid 12-digit Aadhaar number.");

    if (payload.motherAadhaar && !isValidAadhaar(payload.motherAadhaar))
      errors.push("Mother Aadhaar must be a valid 12-digit Aadhaar number.");

    if (payload.spouseAadhaar && !isValidAadhaar(payload.spouseAadhaar))
      errors.push("Spouse Aadhaar must be a valid 12-digit Aadhaar number.");

    if (Array.isArray(payload.children)) {
      payload.children.forEach((child, index) => {
        if (child.aadhaar && !isValidAadhaar(child.aadhaar))
          errors.push(`Child ${index + 1} Aadhaar must be a valid 12-digit Aadhaar number.`);
      });
    }

    if (errors.length > 0) {
      throw new Error(errors.join(" "));
    }
  }

  async validatedToken(token, mobileNumber) {
    console.log("Validating token for mobile number:", mobileNumber);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.mobileNumber === mobileNumber) {
        console.log("mobile number verification successful for:", mobileNumber);
        return decoded.mobileNumber;
      }
    } catch (err) {
      console.error("Error validating token:", err);
    }
    return false;
  }
  async create(data) {
    await this.validateRegistration(data);

    const counter = await RegistrationCounter.findByIdAndUpdate(
      { _id: "registrationId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    data.registrationId = counter.seq.toString().padStart(4, "0");

    return Registration.create(data);
  }

  async updateById(id, data, { publicEdit = false } = {}) {
    const existing = await Registration.findById(id);
    if (!existing) {
      throw new Error("Registration not found.");
    }

    const payload = this.sanitizeRegistrationUpdate(data, { publicEdit });

    if (publicEdit) {
      if (payload.mobile && payload.mobile !== existing.mobile) {
        throw new Error("Mobile number cannot be changed in public edit.");
      }
      if (payload.email && payload.email !== existing.email) {
        throw new Error("Email cannot be changed in public edit.");
      }
      payload.mobile = existing.mobile;
      payload.email = existing.email;
    }

    const validationPayload = { ...existing.toObject(), ...payload };
    if (publicEdit && data.mobileVerficationToken) {
      validationPayload.mobileVerficationToken = data.mobileVerficationToken;
    }

    await this.validateRegistration(validationPayload, {
      publicEdit,
      existingRecord: existing,
    });

    return Registration.findByIdAndUpdate(id, payload, { new: true });
  }
  async requestVerification(mobileNumber) {
    if (process.env.OTP_VALIDATION_ENABLED === 'false') {
      return { message: "OTP validation is disabled. Use static OTP." };
    }

    const result = await this.sendOtp(mobileNumber);

    if (!result) {
      throw new Error("Failed to send OTP");
    }

    return { message: "OTP sent to mobile number" };
  }
  async sendOtp(mobileNumber) {
    let attempts = 3;

    while (attempts--) {
      try {
        const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${mobileNumber}/AUTOGEN`;
        const response = await axios.get(url);

        if (response.data && response.data.Status === "Success") {
          const sessionId = response.data.Details;
          await MobileVerification.findOneAndUpdate(
            { mobileNumber },
            { sessionId },
            { upsert: true, new: true }
          );
          return response.data;
        } else {
          throw new Error("2Factor API Error: " + JSON.stringify(response.data));
        }
      } catch (error) {
        if (attempts === 0) {
          console.error('Final OTP Error:', error);
          return null;
        }
      }
    }
  }
  async checkOtp(phoneNumber, codeFromUser) {
    try {
      const verificationRecord = await MobileVerification.findOne({ mobileNumber: phoneNumber });
      if (!verificationRecord || !verificationRecord.sessionId) {
        console.log('No OTP session found.');
        return false;
      }

      const sessionId = verificationRecord.sessionId;
      const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${codeFromUser}`;
      const response = await axios.get(url);

      if (response.data && response.data.Status === "Success" && response.data.Details === "OTP Matched") {
        console.log('User Verified Successfully!');
        // Optional: clear the session
        await MobileVerification.deleteOne({ mobileNumber: phoneNumber });
        return true;
      } else {
        console.log('Invalid OTP.', response.data);
        return false;
      }
    } catch (error) {
      console.error('Error verifying OTP:', error.response?.data || error.message);
      return false;
    }
  }
  async verifyOTP(mobileNumber, otp) {
    console.log("Signing token with mobileNumber:", mobileNumber);
    const token = this.generateTokenWithMobileNumber(mobileNumber);

    if (process.env.OTP_VALIDATION_ENABLED === 'false') {
      if (otp === process.env.STATIC_OTP) {
        return { token };
      }
      return { message: "Invalid OTP" };
    }

    if (await this.checkOtp(mobileNumber, otp)) {
      return { token };
    }
    return { message: "Invalid OTP" };
  }

  generateTokenWithMobileNumber(mobileNumber) {
    return jwt.sign(
      { mobileNumber },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  async submitRating(data) {
    return Rating.create(data);
  }
  async updateDashboardData(data) {
    return DashboardData.create(data);
  }
  findAll() {
    return Registration.find();
  }
  async getStates() {
    const usersCount = await UsersCount.findOneAndUpdate(
      {},
      { $inc: { numberOfUsers: 1 } },
      {
        new: true,
        upsert: true
      }
    );
    const queryFilter = {
      status: "APPROVED",
    };
    const approvedRegistration = await Registration.countDocuments(queryFilter);
    const result = await Rating.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);
    return {
      ApprovedRegistration: approvedRegistration,
      AverageRating: result[0].averageRating.toFixed(1),
      TotalRatings: result[0].totalRatings,
      VisitorsCount: usersCount.numberOfUsers,
      DashboardData: await DashboardData
        .find()
        .select("typeCode description -_id")
        .sort({ createdAt: -1 })
        .limit(10)

    };
  }
  async getAdminStates() {
    const usersCount = await UsersCount.findOne();
    const result = await Rating.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);
    return {
      TotalMembers: await Registration.countDocuments(),
      PendingRegistration: await Registration.countDocuments({ status: "PENDING" }),
      ApprovedRegistration: await Registration.countDocuments({ status: "APPROVED" }),
      RejectedRegistration: await Registration.countDocuments({ status: "REJECTED" }),
      AverageRating: result[0].averageRating.toFixed(1),
      TotalRatings: result[0].totalRatings,
      VisitorsCount: usersCount.numberOfUsers,
    };
  }
  async findAllWithFilters(
    filter,
    status,
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
  ) {
    const skip = (pageNumber - 1) * pageSize;

    let queryFilter = {};

    if (filter) {
      const regex = new RegExp(filter, "i");
      queryFilter = {
        $or: [
          { registrationId: regex },
          { firstName: regex },
          { middleName: regex },
          { lastName: regex },
          { gender: regex },
          { dob: regex },
          { age: regex },
          { maritalStatus: regex },
          { mobile: regex },
          { alternateMobile: regex },
          { email: regex },
          { aadhaar: regex },
          { subCaste: regex },
          { fatherName: regex },
          { fatherOccupation: regex },
          { motherName: regex },
          { motherOccupation: regex },
          { houseNo: regex },
          { street: regex },
          { city: regex },
          { district: regex },
          { mandal: regex },
          { village: regex },
          { fatherAadhaar: regex },
          { motherAadhaar: regex },
          { spouseAadhaar: regex },
          { qualification: regex },
          { course: regex },
          { status: regex },
        ],
      };
    }
    if (status) {
      queryFilter.status = status;
    }

    const data = await Registration.find(queryFilter)
      .sort({ [sortBy]: sortDirection === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const count = await Registration.countDocuments(queryFilter);

    return { data, count };
  }

  findById(id) {
    return Registration.findById(id);
  }
  updateStatus(id, status) {
    return Registration.findByIdAndUpdate(id, { status }, { new: true });
  }
  deleteById(id) {
    return Registration.findByIdAndDelete(id);
  }
  async findApproved(filter, status, pageNumber, pageSize, sortBy, sortDirection) {
    const skip = (pageNumber - 1) * pageSize;

    const queryFilter = {
      status: "APPROVED",
    };

    if (filter) {
      const regex = new RegExp(filter, "i");

      queryFilter.$or = [
        { registrationId: regex },
        { firstName: regex },
        { middleName: regex },
        { lastName: regex },
        { gender: regex },
        { maritalStatus: regex },
        { mobile: regex },
        { alternateMobile: regex },
        { email: regex },
        { aadhaar: regex },
        { subCaste: regex },
        { fatherName: regex },
        { fatherOccupation: regex },
        { motherName: regex },
        { motherOccupation: regex },
        { houseNo: regex },
        { street: regex },
        { city: regex },
        { district: regex },
        { mandal: regex },
        { village: regex },
        { fatherAadhaar: regex },
        { motherAadhaar: regex },
        { spouseAadhaar: regex },
        { qualification: regex },
        { course: regex },
      ];
    }
    if (status) {
      queryFilter.status = status;
    }

    const data = await Registration.find(queryFilter)
      .sort({ [sortBy]: sortDirection === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const count = await Registration.countDocuments(queryFilter);

    return { data, count };
  }
}

module.exports = new RegistrationRepository();
