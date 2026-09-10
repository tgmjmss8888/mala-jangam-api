// Authentication service
const jwt = require("jsonwebtoken");
const repo = require("../repositories/admin.repository");

exports.registerAdmin = (data) => {
  return repo.create(data);
}
exports.checkIsAdminUserExist = (email) => {
  return repo.findByEmail(email);
}
exports.generateToken = (admin) => {
  return jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};
