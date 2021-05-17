const User = require('../models/user');
const Post = require('../models/post');
const errorHandler = require('../util/errorHandler');
const bcrypt = require('bcrypt');
const validator = require('validator').default;
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

    console.log(postInput.imageUrl);
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
  updatePost: async function ({ postId, postInput }, req) {
    if (!req.isAuth) {
      throw errorHandler(new Error('Not authenticated.', 401));
    }
    let { title, content, imageUrl } = postInput;

    const post = await Post.findById(postId).populate('creator');
    if (post.creator._id.toString() !== req.userId.toString()) {
      throw errorHandler(
        new Error('You are not authorized to modify this post.', 403)
      );
    }
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
    // Todo: check image is correct file type
    if (errors.length > 0) {
      throw errorHandler(new Error('Invalid post data.'), 422);
    }

    post.title = title;
    post.content = content;
    if (imageUrl !== 'undefined') {
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },
  getPosts: async function ({ page }, req) {
    if (!req.isAuth) {
      throw errorHandler(new Error('Not authenticated.', 401));
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('creator');

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
  getPost: async function ({ postId }, req) {
    if (!req.isAuth) {
      throw errorHandler(new Error('Not authenticated.', 401));
    }
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      throw errorHandler(new Error('No post found'), 404);
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  getStatus: async function (args, req) {
    if (!req.isAuth) {
      throw errorHandler(new Error('Not authenticated.', 401));
    }
    const user = await User.findById(req.userId);
    if (!user) {
      throw errorHandler(new Error('No user with that ID found.'));
    }
    return {
      status: user.status,
    };
  },
  updateStatus: async function ({ statusInput }, req) {
    if (!req.isAuth) {
      throw errorHandler(new Error('Not authenticated.', 401));
    }
    const user = await User.findById(req.userId);
    if (!user) {
      throw errorHandler(new Error('No user with that ID found.'));
    }
    user.status = statusInput.status;
    await user.save();
    return {
      status: user.status,
    };
  },
};
