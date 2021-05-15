const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype == 'image/png' ||
    file.mimetype == 'image/jpg' ||
    file.mimetype == 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single('image')
);

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    // graphql rejects non POST requests, this skips the 'OPTIONS' request.
    return res.sendStatus(200);
  }
  next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(error) {
      if (!error.originalError) {
        return error;
      }
      const data = error.originalError.data;
      const message = error.message || 'An error occurred.';
      const code = error.originalError.statusCode || 500;
      return { message: message, data: data, status: code };
    },
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(statusCode).json({ message: message, data: data });
});

mongoose
  .connect(
    'mongodb+srv://kwdev:hGpdnjoKUXFnntAD@cluster0.jykit.mongodb.net/messages?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
  )
  .then(result => {
    app.listen(8080);
  })
  .catch(err => console.log(`Mongoose Connection Error`, err));
