const path = require('path');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const rateLimit = require('express-rate-limit'); //preventing rate of limit, DOS attack
const helmet = require('helmet'); //est other http secutiy
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const globalErrorHandler = require('./controllers/errorController');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const app = express();
const hpp = require('hpp'); //to prevent http parameter pollution
const cors = require('cors');
app.set('view engine', 'pug'); // Setting pug template
app.set('views', path.join(__dirname, 'views'));
const cookieParser = require('cookie-parser');
//Serving static files
app.use(express.static(path.join(__dirname, 'public'))); //by doing this middlware, it sets up that if the url does not hit any router, it will go to the public folder and make it root
console.log(path.join(__dirname, 'public'));

//1  GLOBAL MIDDLEWARE
//Set Secutity HTTP headers
app.use(cors());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      scriptSrc: [
        "'self'",
        'https://cdnjs.cloudflare.com',
        'https://api.mapbox.com',
        'https://js.stripe.com', // Added Stripe.js CDN
      ],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", 'https:', 'unsafe-inline'],
      connectSrc: ["'self'", 'http://127.0.0.1:3000'], // Allow connections to backend
      upgradeInsecureRequests: [],
    },
  }),
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
//Limit request from SAME API
app.use('/api', limiter); //control the limit rate

// console.log(process.env.NODE_ENV);

// Boyd parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //This one is middleware, that modifies the incoming request data, standing between request and resposne--> make req.body be able to used
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Data sanitization agaisnt NOSQL quert injection
app.use(mongoSanitize()); //remove all the dollar sign

//Data sanization against XSS
app.use(xss()); //remove all maliciouse code in html

// Prevent parameter pollution
app.use(
  //if i put column name in white list, we allows duplicates in the query string
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
); // ->not allow duplicate, getting the last value of duplicate as default

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 🥰');
//   console.log(req.cookies);
//   next();
// });

// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   console.log(req.headers);
//   next();
// });

// 2 Route Handlers

// app.get('/api/v1/tours/:id', getTour);
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//3. Route

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); //specify the route we actually want to use the middeleware tourRouter
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//4. Server

// No route match, app.all() for all http methods
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  //Passing the error to the next, when we pass anything into next, it will send to the global handling error and skip other middleware in the stack
  // next(err);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Handling error, by specifying 5 arguments. Express will not its error handling mdidleware
app.use(globalErrorHandler);
module.exports = app;
