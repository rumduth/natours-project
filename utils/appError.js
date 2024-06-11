class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    this.isOperational = true;

    //capture the stack trace and put it in the stack property
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
