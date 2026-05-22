const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const connectDB = require('../config/db');
const cors = require('../config/cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const apiRouter = require('./routes');

// Load environment configurations
dotenv.config();

// Connect Database
connectDB();

const app = express();

// 1) GLOBAL SECURITY MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP (DDoS and brute-force guard)
app.use('/api', apiLimiter);

// Body parser, reading data from body into req.body with 10kb size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// CORS configuration middleware
app.use(cors);

// 2) API ROUTES
app.use('/api', apiRouter);

// 3) UNHANDLED ROUTE PROTECTION
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4) GLOBAL ERROR HANDLER
app.use(errorHandler);

module.exports = app;
