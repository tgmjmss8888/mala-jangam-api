// Registration service
const repo = require("../repositories/registration.repository");

exports.registerMember = (data) => repo.create(data);
exports.updateMember = (id, data) => repo.updateById(id, data, { publicEdit: false });
exports.publicUpdateMember = (id, data) => repo.updateById(id, data, { publicEdit: true });
exports.submitRating = (data) => repo.submitRating(data);
exports.updateDashboardData = (data) => repo.updateDashboardData(data);
exports.getAll = () => repo.findAll();
exports.getStates = async () => await repo.getStates();
exports.getAdminStates = async () => await repo.getAdminStates();
exports.getGridList = async (filter,status,pagenumber,pagesize,sortby,sortdirection) =>
  await repo.findAllWithFilters(filter,status,pagenumber,pagesize,sortby,sortdirection);
exports.approve = (id) => repo.updateStatus(id, "APPROVED");
exports.reject = (id) => repo.updateStatus(id, "REJECTED");
exports.deleteMember = (id) => repo.deleteById(id);
exports.getApproved = async (filter,status,pagenumber,pagesize,sortby,sortdirection) =>
  repo.findApproved(filter,status,pagenumber,pagesize,sortby,sortdirection);
exports.mobileVerificationRequest = (data) => repo.requestVerification(data);
exports.verifyOTP = (mobileNumber, otp) => repo.verifyOTP(mobileNumber, otp);
