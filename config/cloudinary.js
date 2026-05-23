/**
 * ==============================================================================
 * 🔥 LIVE AUCTION PLATFORM PAKISTAN - CLOUDINARY CONFIGURATION
 * File: config/cloudinary.js
 * ==============================================================================
 * Is file mein hum Cloudinary SDK version 2 configure kar rahe hain taake
 * product images aur short videos directly Cloudinary par upload kiye jaa sakein.
 */

const cloudinary = require('cloudinary').v2;

// Cloudinary config loading environment variables
// 🔑 ADD YOUR KEY HERE
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
// 🔑 ADD YOUR KEY HERE
const apiKey = process.env.CLOUDINARY_API_KEY;
// 🔑 ADD YOUR KEY HERE
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Ensure all settings are present
if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️ Cloudinary environment variables are missing! Media uploads will fail if not configured.');
}

// Config instance setup
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

console.log('✅ Cloudinary Configured Successfully');

module.exports = cloudinary;
