/**
 * ==============================================================================
 * 🔥 LIVE AUCTION PLATFORM PAKISTAN - SERVER ENTRYPOINT
 * File: server.js
 * ==============================================================================
 * Ye server entrypoint file hai jo HTTP server start karti hai, Socket.io aur Redis
 * ko attach karti hai, database connect karti hai aur cron jobs register karti hai.
 */

const http = require("http");
const dotenv = require("dotenv");

// Load environment variables (.env file se configurations load karna)
dotenv.config();

// Custom imports
const app = require("./app");
const connectDB = require("./config/db");
const { initRedis } = require("./config/redis");
const { initSocket } = require("./config/socket");
const { initAuctionJobs } = require("./jobs/auctionJobs");

// PORT check from env or defaults to 5000
const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping express app for Socket.io integration
const server = http.createServer(app);

// Server startup function wrapper
const startServer = async () => {
  try {
    console.log("🔄 Starting Live Auction Backend Server...");

    // 1. 💾 MongoDB Database Connection
    await connectDB();

    // 2. ⚡ Redis client initialization (Caching/OTP & Socket Adapter if clustered)
    // await initRedis();

    // 3. 🔌 Socket.io Real-time connection attach
    const io = initSocket(server);
    console.log("✅ Socket.io initialized & attached to server");

    // 4. ⏰ node-cron Jobs Initialization (Auto-start/end auctions scheduler)
    initAuctionJobs();
    console.log("✅ Cron jobs initialized for auction lifecycles");

    // 5. 🚀 Start listening for incoming network requests
    server.listen(PORT, () => {
      console.log(
        `===========================================================`,
      );
      console.log(`🚀 SERVER RUNNING IN [${process.env.NODE_ENV}] MODE`);
      console.log(`🔊 Listening on PORT: ${PORT}`);
      console.log(`🔗 Local Address: http://localhost:${PORT}`);
      console.log(
        `===========================================================`,
      );
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

// Global handlers for unhandled promise rejections / exceptions
process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED REJECTION! Shutting down gracefully...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down immediately...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Run server startup
startServer();
