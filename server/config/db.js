const mongoose = require('mongoose');
const { ensureDemoProvisioned } = require('../utils/demoProvisioner');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    ensureDemoProvisioned().catch((e) => console.error('Demo provision error:', e.message));
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
      })
      .then(async (conn) => {
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        ensureDemoProvisioned().catch((e) => console.error('Demo provision error:', e.message));
        return conn;
      })
      .catch((err) => {
        cachedPromise = null;
        console.error(`❌ MongoDB connection error: ${err.message}`);
        throw err;
      });
  }

  return cachedPromise;
};

module.exports = connectDB;
