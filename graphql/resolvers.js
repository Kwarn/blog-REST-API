const User = require('../models/user');
const Post = require('../models/post');
const errorHandler = require('../util/errorHandler');
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
      throw errorHandler(new Error('Invalid input.'), 422, null, errors);
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
      throw errorHandler(new Error('No user found.'), 401);
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw errorHandler(new Error('Password is incorrect.'), 401);
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
  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      throw errorHandler(new Error('Not authenticated.', 401));
    }
    let { title, content, imageUrl } = postInput;

    imageUrl = 'testing image URL';

    console.log(title, content, imageUrl);

    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: 'Invalid title.' });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: 'Invalid content.' });
    }
    // if (!validator.isURL(imageUrl)) {
    //   errors.push({ message: 'Invalid image URL.' });
    // }

    if (errors.length > 0) {
      throw errorHandler(new Error('Invalid post data.'), 422);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw errorHandler(new Error('No user found.'), 401);
    }
    const post = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: user,
    });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  getPosts: async function (args, req) {
    if (!req.isAuth) {
      throw errorHandler(new Error('Not authenticated.', 401));
    }
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find().sort({ createdAt: -1 }).populate('creator');

    return {
      posts: posts.map(p => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },
};
