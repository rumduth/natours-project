const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv"); // to use environment variables

dotenv.config({ path: `${__dirname}/../../config.env` }); // read variables from the file and save them into node JS environment variables

const Tour = require(`${__dirname}/../../models/tourModel`);
const Review = require(`${__dirname}/../../models/reviewModel`);
const User = require(`${__dirname}/../../models/userModel`);
const DB = process.env.DATABASE_LOCAL;

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

const connectDB = async () => {
  try {
    await mongoose.connect(DB);
    console.log("DB connection successful");
  } catch (err) {
    console.log("DB connection failed");
    process.exit(1); // Exit process with failure
  }
};

const importData = async () => {
  await connectDB();
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("Data successfully loaded");
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.disconnect();
    console.log("DB connection closed after import");
  }
};

const deleteData = async () => {
  await connectDB();
  try {
    await Tour.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log("Empty database");
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.disconnect();
    console.log("DB connection closed after delete");
  }
};

if (process.argv[2] === "--import") {
  importData().then(() => process.exit());
} else if (process.argv[2] === "--delete") {
  deleteData().then(() => process.exit());
}
