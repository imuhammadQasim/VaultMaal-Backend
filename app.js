const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const path = require("path");

const ApiError = require("./utils/ApiError");
const errorHandler = require("./middlewares/errorHandler.middleware");

const authRoutes = require("./routes/auth.routes");
const auctionRoutes = require("./routes/auction.routes");
const bidRoutes = require("./routes/bid.routes");
const walletRoutes = require("./routes/wallet.routes");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Rate limiting to prevent DDoS & Bruteforce attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth endpoints limiters to secure login/otp against brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 15, // max 15 requests per 15 minutes per IP
  message: {
    status: 429,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// Apply rate limiter to /api routes
app.use("/api", apiLimiter);

// Development mode logging (logs incoming requests to console)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Request body size limiting to prevent payload injection attacks (Max 10kb standard, 50MB for video upload routes is handled separately or relaxed here)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Parse request cookies (JWT Refresh tokens read karne ke liye)
app.use(cookieParser());

// Data sanitization against NoSQL query injection (e.g. {"$gt": ""})
app.use(mongoSanitize());

// 3. 📂 SERVE STATIC FILES FOR FRONTEND TESTING UI
// Is server se static html dashboard load hoga taake user API flows test kar sakein
app.use(express.static(path.join(__dirname, "public")));

// 4. 🔌 API ROUTE ROUTERS
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/wallet", walletRoutes);

// 5. 404 UNHANDLED ROUTE PROTECTION
app.all("*", (req, res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// 6. GLOBAL ERROR HANDLER MIDDLEWARE
app.use(errorHandler);

module.exports = app;
