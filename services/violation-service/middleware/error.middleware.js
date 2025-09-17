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

  // Sequelize connection errors
  if (err.name === 'SequelizeConnectionError') {
    error = {
      message: 'Database Connection Error',
      status: 503,
      details: 'Unable to connect to database'
    };
  }

  // Axios errors (AI integration)
  if (err.isAxiosError) {
    if (err.response) {
      // Server responded with error status
      error = {
        message: 'AI Integration Error',
        status: err.response.status,
        details: err.response.data?.message || err.response.statusText
      };
    } else if (err.request) {
      // Request was made but no response received
      error = {
        message: 'AI Service Unavailable',
        status: 503,
        details: 'AI service did not respond'
      };
    } else {
      // Something else happened
      error = {
        message: 'AI Integration Error',
        status: 500,
        details: err.message
      };
    }
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
