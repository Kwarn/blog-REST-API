const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const errorHandler = require('../util/errorHandler');
const bcrypt = require('bcrypt');

exports.putSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.errors.length) {
    throw errorHandler(
      new Error('Validation failed'),
      422,
      null,
      errors.array()
    );
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  bcrypt
    .hash(password, 12)
    .then(hashedPass => {
      const user = new User({
        email: email,
        password: hashedPass,
        name: name,
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({ message: 'User created', userId: result._id });
    })
    .catch(err => errorHandler(err, 500, next));
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        throw errorHandler(
          new Error('User with that email address not found.'),
          401
        );
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        throw errorHandler(new Error('Incorrect password'), 401);
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        'someSuperSecretSecret',
        { expiresIn: '1h' }
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch(err => errorHandler(err, 500, next));
};
