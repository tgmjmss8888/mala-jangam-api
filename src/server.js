require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { initGridFS } = require("./config/gridFs");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    
    // Ensure connection is fully ready before initializing GridFS
    if (mongoose.connection.readyState === 1) {
      initGridFS();
    } else {
      mongoose.connection.once("open", () => {
        initGridFS();
      });
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to database", err);
    process.exit(1);
  }
})();
