const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gridFSBucket;

const initGridFS = () => {
  const db = mongoose.connection.db;

  gridFSBucket = new GridFSBucket(db, {
    bucketName: "documents"
  });

  console.log("GridFS initialized");
};

const getGridFSBucket = () => {
  initGridFS();
  if (!gridFSBucket) {
    throw new Error("GridFS not initialized");
  }
  return gridFSBucket;
};

module.exports = { initGridFS, getGridFSBucket };
