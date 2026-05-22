const AppError = require('../utils/AppError');

/**
 * Express middleware to validate request using Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} source - Location of data to validate ('body', 'params', 'query')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: true, // ignore unknown fields
      stripUnknown: true, // remove unknown fields to sanitize input
    });

    if (error) {
      const errorMessage = error.details
        .map((details) => details.message.replace(/"/g, ''))
        .join(', ');
      return next(new AppError(`Validation Error: ${errorMessage}`, 400));
    }

    // Replace request data with sanitized, validated values
    req[source] = value;
    next();
  };
};

module.exports = validate;
