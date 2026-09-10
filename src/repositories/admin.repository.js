// Admin repository
const Admin = require("../models/Admin");

class AdminRepository {
  create(data) {
    return Admin.create(data);
  }
  findByEmail(email) {
    return Admin.findOne({ email });
  }
}

module.exports = new AdminRepository();
