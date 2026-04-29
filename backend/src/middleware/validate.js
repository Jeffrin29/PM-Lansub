const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/helpers');

/**
 * Runs after express-validator chains.
 * If there are validation errors, returns a 422 with formatted messages.
 * Otherwise calls next().
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));
    return errorResponse(res, formatted[0].message || 'Validation failed. Please check your input.', 422, formatted);
  }
  next();
};

module.exports = { validate };
