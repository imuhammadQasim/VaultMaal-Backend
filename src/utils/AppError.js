/**
 * Custom AppError constructor function
 * Represents an operational error within the application.
 * @param {String} message 
 * @param {Number} statusCode 
 */
function AppError(message, statusCode) {
  const error = new Error(message);
  
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  error.isOperational = true;

  // Set the prototype of the error object to inherit from AppError
  Object.setPrototypeOf(error, AppError.prototype);
  
  // Capture the stack trace, omitting the AppError constructor call
  Error.captureStackTrace(error, AppError);
  
  return error;
}

// Inherit AppError from the standard Error class prototype
Object.setPrototypeOf(AppError.prototype, Error.prototype);

module.exports = AppError;
