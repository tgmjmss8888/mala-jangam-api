const service = require("../services/registration.service");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { getR2Client } = require("../config/r2");
const { PutObjectCommand } = require("@aws-sdk/client-s3");


exports.create = async (req, res) => {
  try {
    const data = req.body;
    await connectDB();
    if (data.children) {
      try {
        data.children = JSON.parse(data.children);
      } catch (err) {
        return res.status(400).json({ message: "Invalid children data format" });
      }
    }
    if (req.file) {
      try {
        const client = getR2Client();
        const bucketName = process.env.R2_BUCKET_NAME;
        const key = `${Date.now()}-${req.file.originalname}`;

        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        });

        await client.send(command);
        data.documentId = key; // Store R2 key reference

        const result = await service.registerMember(data);
        res.status(201).json(result);
      } catch (err) {
        console.error("R2 upload failed:", {
          name: err?.name,
          message: err?.message,
          httpStatusCode: err?.$metadata?.httpStatusCode,
          requestId: err?.$metadata?.requestId,
          extendedRequestId: err?.$metadata?.extendedRequestId,
        });
        res.status(500).json({ message: err.message });
      }
    } else {
      const result = await service.registerMember(data);
      res.status(201).json(result);
    }

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.submitRating = async (req, res) => {
  await connectDB();
  var ip = req.headers["x-forwarded-for"]?.split(",")[0] || 
    req.socket?.remoteAddress ||
    req.ip ||
    "";
  req.body.ipAddress = ip;
  req.body.createdDateTime = new Date();
  res.status(201).json(await service.submitRating(req.body));
};

exports.requestVerification = async (req, res) => {
  await connectDB();
  res.json(await service.mobileVerificationRequest(req.body.mobileNumber));
};
exports.verifyOTP = async (req, res) => {
  await connectDB();
  const result = await service.verifyOTP(req.body.mobileNumber, req.body.otp);
  if (result.message) {
    return res.status(400).json(result);
  }
  res.json(result);
};
exports.updateDashboardData = async (req, res) => {
  await connectDB();
  var ip = req.headers["x-forwarded-for"]?.split(",")[0] || 
    req.socket?.remoteAddress ||
    req.ip ||
    "";
  req.body.ipAddress = ip;
  req.body.createdDateTime = new Date();
  res.status(201).json(await service.updateDashboardData(req.body));
};

exports.getStates = async (_, res) => {
  await connectDB();
  res.json(await service.getStates());
};

exports.getAdminStates = async (_, res) => {
  await connectDB();
  res.json(await service.getAdminStates());
};

exports.list = async (_, res) => {
  await connectDB();
  res.json(await service.getAll());
};

exports.gridlist = async (req, res) => {
  await connectDB();
  res.json(
    await service.getGridList(
      req.query.filter,
      req.query.status,
      req.query.pagenumber,
      req.query.pagesize,
      req.query.sortby,
      req.query.sortdirection
    )
  );
};

exports.approve = async (req, res) => {
  await connectDB();
  res.json(await service.approve(req.params.id));
};

exports.reject = async (req, res) => {
  await connectDB();
  res.json(await service.reject(req.params.id));
};
exports.deleteMember = async (req, res) => {
  await connectDB();
  try {
    const deleted = await service.deleteMember(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Registration not found." });
    }
    res.json({ message: "Registration deleted successfully." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.publicList = async (req, res) => {
  await connectDB();
  res.json(
    await service.getApproved(
      req.query.filter,
      req.query.status,
      req.query.pagenumber,
      req.query.pagesize,
      req.query.sortby,
      req.query.sortdirection
    )
  );
};

exports.update = async (req, res) => {
  await connectDB();
  try {
    const result = await service.updateMember(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.publicUpdate = async (req, res) => {
  await connectDB();
  try {
    const result = await service.publicUpdateMember(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.healthcheck = async (req, res) => {
  try {
    await connectDB();

    const state = mongoose.connection.readyState;

    return res.json({
      mongoState: state,
      connected: state === 1,
    });
  } catch (err) {
    console.error("Mongo error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
};
