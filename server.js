const mongoose = require('mongoose');
const dotenv = require('dotenv'); //to use enviroment variable

//Handle uncaught exception
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);

  process.exit(1);
});
dotenv.config({ path: './config.env' }); //read varialbes from the files and then save them into node JS environment variables
const app = require('./app');

const DB = process.env.DATABASE_LOCAL;

mongoose //connnect to the mongoose
  .connect(DB)
  .then((conn) => {
    console.log('DB connection succesful');
  });

// console.log(process.env);
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// TEST

// To handle unresolved promises such as database connection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// console.log(L); // uncaught exception
