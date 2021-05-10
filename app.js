const express = require('express');
const feedRoutes = require('./routes/feed');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  res.status(statusCode).json({ message: message });
});

mongoose
  .connect(
    'mongodb+srv://kwdev:hGpdnjoKUXFnntAD@cluster0.jykit.mongodb.net/messages?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(result => {
    console.log('Mongoose Connected Successfully');
    app.listen(8080);
  })
  .catch(err => console.log(`Mongoose Connection Error`, err));
