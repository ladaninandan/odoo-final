import AppError from '../errors/AppError.js';

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // In Development: Print massive stack traces so we can debug easily!
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  // In Production: Hide stack traces so we don't leak logic to hackers!
  else {
    if (err.isOperational) {
      // Known operational errors like "Invalid Email" or "Not Logged in"
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Unknown programming bugs (Mongoose crashed, Null reference, etc.)
      console.error('💥 CRITICAL ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong internally!'
      });
    }
  }
};

// Catch requests that aren't defined in any routes!
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(error);
};
