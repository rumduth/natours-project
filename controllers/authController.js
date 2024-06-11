const { promisify } = require('util'); // for using promisified method
const jwt = require('jsonwebtoken'); // to check authentication
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
// const { decode } = require('punycode');
const Email = require('./../utils/email');
// const sendEmail = require('../utils/email');

const crypto = require('crypto'); //create random token, used for encrypt token to change password

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); //creating token
};

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  ),
  //   secure: true, //only works with https, if not, cookie is note created
  httpOnly: true,
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Setting up the cookie to sent back to client
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  //Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log({ email, password });

  //1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provde email and password', 400));
  }

  //2. Check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  const correct = await user.correctPassword(password, user.password);
  console.log(correct);
  if (!user || !correct)
    return next(new AppError('Incorrect email or password', 401));
  //3. If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1. Getting the token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401),
    );
  }

  //2. Verification/ Validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3. Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The user no longer exist', 401));
  }
  //4. Check if the user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );
  }

  //Grant Acess to Protected Route
  res.locals.user = freshUser;

  req.user = freshUser;
  next();
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

//restrict delete users for certain accounts
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  console.log(user);
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  //2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  //3. Send it to user's email

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 mins)',
    //   message: message,
    //   text: message,
    // });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); //check if user is exist or password-time has been expired yet

  //2. If token has not expired, if there is a user, set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetToken = undefined;
  user.passwordResetExpires = undefined;

  //3. Update changedPasswordAt property for the user
  await user.save();

  //4. Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //2. Check if the POSTed current password is correct
  const correct = await user.correctPassword(
    req.body.passwordCurrent,
    user.password,
  );
  if (!correct) {
    return next(new AppError('Your current password is wrong', 401));
  }
  //3. If so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4/ Log user in, send JWT
  createSendToken(user, 200, res);
  //   const password = req.body.password;
  //   if (!req.user.correctPassword(req.body.password, req.user.password)) {
  //     return next(new AppError('Your password is not valid', 401));
  //   }
  //   req.user.password = req.body.password;
  //   req.user.save({});
});

//only foe rendered pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      //3. Check if user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      //4. Check if the user changed password after the token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = freshUser;
    } catch (err) {
      return next();
    }
    //2. Verification/ Validate token
  }
  next();
};
