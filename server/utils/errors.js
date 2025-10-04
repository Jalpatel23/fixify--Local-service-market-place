const logger = require('./logger');

function errorResponse(res, status, code, message, details) {
  return res.status(status).json({
    success: false,
    error: { code, message, details }
  });
}

function wrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      logger.error({ err }, 'Unhandled controller error');
      return errorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  };
}

module.exports = { errorResponse, wrap };

