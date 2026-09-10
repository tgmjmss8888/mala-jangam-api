// Admin controller
const bcrypt = require("bcryptjs");
const repo = require("../repositories/admin.repository");
const { generateToken, registerAdmin, checkIsAdminUserExist } = require("../services/auth.service");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");

exports.create = async (req, res) => {
  await connectDB();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;

    const existingUser = await checkIsAdminUserExist(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await registerAdmin({
      name,
      email,
      password: hashedPassword
    });

    // const token = jwt.sign(
    //   { userId: user._id },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRES_IN }
    // );

    res.status(201).json({
      message: "User registered successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  await connectDB();
  const admin = await repo.findByEmail(req.body.email);
  if (!admin || !(await bcrypt.compare(req.body.password, admin.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({ token: generateToken(admin),data: admin });
};
