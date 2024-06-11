//We use Schema to describe our data, to set default values, to validate the data and all kinds of stuffs
const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator"); //For validation
const User = require("./userModel");
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true, //remove all the white space in the begining and the of the string
      maxlength: [
        40,
        "The tour name must have less or equal than 40 characters",
      ],
      minLength: [
        10,
        "The tour name must have more or equal than 10 characters",
      ],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => {
        return Math.round(val * 10) / 10;
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      //tp create our validator --> we should use validate, return true or false
      validate: {
        validator: function (val) {
          return val <= this.price;
        }, //tp create our validator
        message: "Dicount price ({VALUE}) should be below the regular price",
      },
    },
    summary: {
      type: String,
      trim: true, //remove all the white space in the begining and the of the string
      required: [true, "A tour must have a description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(), //in Mongo, it will convert to the date, not millisecond
      select: false, // To avoid showing this property when we request from the database
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
      select: false,
    },
    startLocation: {
      //GeoJSON to specify geospatial DATA
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true }, //each time the data is ouputted as JSON
    toObject: { virtuals: true },
  }
);

//index help the search faster
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });
//Virtual properties are fields we can create on Shema but will not be persisted, they will not be saved in dataabse
// This propery will be available as soon as we get the data
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

//document middlware: runs before the save() and create(), but not insert()
//each middleware has access to next in mongoose
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// tourSchema.tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

//post middleware happens after all the pre-middlware and can access to doc
tourSchema.post("save", function (doc, next) {
  next();
});

// Query middleware is run before or after a certain query is executed
// it points to a query not document
tourSchema.pre(/^find/, function (next) {
  // all string starts with find
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v",
  });
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  next();
});

// AGGREGATION MIDDLEWARE
//this will point to aggregation object
// tourSchema.pre('aggregate', function (next) {
//   console.log(this._pipeline);
//   this._pipeline.unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// });

//Creating model -> creating API
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

//Virtual properties are fields we can create on Shema but will not be persisted, they will not be saved in dataabse
