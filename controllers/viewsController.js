const Tour = require("./../models/tourModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const User = require("./../models/userModel");
const Booking = require("./../models/bookingModel");
exports.getOverview = catchAsync(async (req, res, next) => {
  //1. Get tour data from collections
  let tours;
  if (req.user) {
    console.log("Yes");
    const bookingTours = await Booking.find({ user: req.user.id });
    const bookedToursID = bookingTours.map((el) => el.tour);
    tours = await Tour.find({ _id: { $nin: bookedToursID } });
  } else {
    tours = await Tour.find({});
  }

  //2. Build template

  //3. render that template using the tour data from step 1

  res.status(200).render("overview", {
    title: "All Tours",
    tours: tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. Get the data, for the requested tour(including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }
  //2. Build template

  //3. Render template using data from 1

  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "default-src 'self' https://*.mapbox.com https://js.stripe.com/v3/;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://js.stripe.com/v3/ https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render("tour", {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render("account", {
    title: "Your account",
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1. Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  //2. find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});

exports.getSignupForm = (req, res) => {
  res.status(200).render("signup");
};
