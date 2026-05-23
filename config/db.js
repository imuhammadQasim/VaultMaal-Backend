/**
 * ==============================================================================
 * 🔥 LIVE AUCTION PLATFORM PAKISTAN - DATABASE CONNECTION CONFIG
 * File: config/db.js
 * ==============================================================================
 * Is file mein hum Mongoose connection handle kar rahe hain to connect to MongoDB.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB Atlas URI reading from environmental variables
    // 🔑 ADD YOUR KEY HERE
    const connStr = process.env.MONGODB_URI;

    if (!connStr) {
      throw new Error('MONGODB_URI env variable is not defined!');
    }

    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(connStr);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection stability event logging
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection lost. Reconnecting...');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

  } catch (error) {
    console.error(`❌ Mongoose Connection Error: ${error.message}`);
    // Process ko crash karein taake container / daemon system ise auto restart kare
    process.exit(1);
  }
};

module.exports = connectDB;
