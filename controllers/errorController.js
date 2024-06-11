const { JsonWebTokenError } = require('jsonwebtoken');
const AppError = require('../utils/appError');

const handleJWTError = () => {
  return new AppError('Invalid Token. Please log in again', 401);
};

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again', 401);

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errorResponse.errmsg.match(/"(.*?)"/g);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors)
    .map((el) => el.message)
    .join('\n');
  console.log(errors);
  const message = `Invalid input data\n${errors}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  //Operational, trusted error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //Programming or other unknown error: don't leak error details
    } else {
      //1. Log error
      console.error('ERROR 💥', err);

      // 2. Send general message
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong',
      });
    }
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: 'Please try again later',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, name: err.name }; //remember err.name is non-enumeable object

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.errorResponse && error.errorResponse.code === 11000)
      error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === `JsonWebTokenError`) error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};

// Some errors we can see in Mongoose
//1. Update
//2. Create Tour --> Duplicate
//3. Get Tour --> CastError
