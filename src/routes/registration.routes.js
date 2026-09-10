const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controllers/registration.controller");
const adminCtrl = require("../controllers/admin.controller");
const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const { getGridFSBucket } = require("../config/gridFs");
const { getR2Client } = require("../config/r2");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

router.post("/register",
  upload.single("document"), ctrl.create);
  router.get("/document/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id) {
      // Fallback for older GridFS files
      const bucket = getGridFSBucket();
      const fileId = new mongoose.Types.ObjectId(id);

      const downloadStream = bucket.openDownloadStream(fileId);
      downloadStream.on('error', () => {
         res.status(404).json({ message: "File not found in GridFS" });
      });
      downloadStream.pipe(res);
    } else {
      // R2 download
      const client = getR2Client();
      const bucketName = process.env.R2_BUCKET_NAME;
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: id
      });
      const response = await client.send(command);
      response.Body.pipe(res);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/registrationslist", auth, ctrl.list);
router.post("/submitrating", ctrl.submitRating);
router.post("/admin/registration/approve/:id", auth, ctrl.approve);
router.post("/admin/registration/reject/:id", auth, ctrl.reject);
router.delete("/admin/registration/:id", auth, ctrl.deleteMember);
router.post("/admin/registration/update/:id", auth, ctrl.update);
router.get("/admin/registrations", auth, ctrl.gridlist);
router.post("/admin/registrations/save", adminCtrl.create);
router.post("/admin/dashboarddataupdate", ctrl.updateDashboardData);
router.post("/admin/login", adminCtrl.login);
router.get("/public/members", ctrl.publicList);
router.post("/public/registration/update/:id", ctrl.publicUpdate);
router.get("/public/healthcheck", ctrl.healthcheck);
router.get("/states", ctrl.getStates);
router.get("/admin/states", ctrl.getAdminStates);

router.post("/mobileVerificationRequest", ctrl.requestVerification);
router.post("/verifyOTP", ctrl.verifyOTP); 
module.exports = router;
