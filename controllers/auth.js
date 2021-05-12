const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const errorHandler = require('../util/errorHandler');
const bcrypt = require('bcrypt');

exports.putSignup = async (req, res, next) => {
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

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email: email,
      password: hashedPassword,
      name: name,
    });
    const user = await newUser.save();
    res.status(201).json({ message: 'User created', userId: user._id });
  } catch (error) {
    errorHandler(error, 500, next);
  }
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      throw errorHandler(
        new Error('User with that email address not found.'),
        401
      );
    }
    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      throw errorHandler(new Error('Incorrect password'), 401);
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      'someSuperSecretSecret',
      { expiresIn: '1h' }
    );
    res.status(200).json({ token: token, userId: user._id.toString() });
  } catch (error) {
    errorHandler(error, 500, next);
  }
};
