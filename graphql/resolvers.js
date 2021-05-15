const User = require('../models/user');
const errorHandler = require('../util/errorHandler');
const errorHander = require('../util/errorHandler');
const bcrypt = require('bcrypt');
const validator = require('validator').default;
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

module.exports = {
  createUser: async function ({ userInput }, req) {
    const { email, name, password } = userInput;
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'Invalid email address.' });
      console.log(`isEmail error`);
    }
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 6 })
    ) {
      errors.push({ message: 'Password must be atleast 6 characters.' });
    }
    if (errors.length > 0) {
      throw errorHander(new Error('Invalid input.'), 422, null, errors);
      console.log(`errors`, errors);
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      throw errorHandler(new Error('That user already exists'), 402);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      name: name,
      password: hashedPassword,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async function ({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
      throw errorHander(new Error('No user found.'), 401);
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw errorHander(new Error('Password is incorrect.'), 401);
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      'supersecretsecret',
      { expiresIn: '1h' }
    );
    return { token: token, userId: user._id.toString() };
  },
};
