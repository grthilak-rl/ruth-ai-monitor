/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    error = {
      message: 'Validation Error',
      status: 400,
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    };
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    error = {
      message: 'Duplicate Entry',
      status: 409,
      details: err.errors.map(e => ({
        field: e.path,
        message: `${e.path} already exists`,
        value: e.value
      }))
    };
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = {
      message: 'Foreign Key Constraint Error',
      status: 400,
      details: 'Referenced record does not exist'
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid Token',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token Expired',
      status: 401
    };
  }

  // Syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = {
      message: 'Invalid JSON',
      status: 400
    };
  }

  // Rate limit errors
  if (err.status === 429) {
    error = {
      message: 'Too Many Requests',
      status: 429
    };
  }

  // Send error response
  res.status(error.status).json({
    error: error.message,
    status: error.status,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(error.details && { details: error.details })
  });
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
