const User = require('../models/user');
const Post = require('../models/post');
const errorHandler = require('../util/errorHandler');
const bcrypt = require('bcrypt');
const validator = require('validator').default;
const jwt = require('jsonwebtoken');

const getPostValidationErrors = (title, content, imageUrl) => {
  const errors = [];
  if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
    errors.push({ message: 'Invalid title.' });
  }
  if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
    errors.push({ message: 'Invalid content.' });
  }
  // ToDo: Validate imageUrl
  if (errors.length > 0) {
    console.log(errors);
    return errors;
  }
  return false;
};

module.exports = {
  createUser: async function ({ userInput: { email, name, password } }, req) {
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
      throw errorHandler('Invalid input.', 422, null, errors);
      console.log(`errors`, errors);
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      throw errorHandler('That user already exists', 402);
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
      throw errorHandler('No user found.', 401);
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw errorHandler('Password is incorrect.', 401);
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
  createPost: async function (
    { postInput: { title, content, imageUrl } },
    req
  ) {
    if (!req.userId) throw errorHandler('Not authenticated.', 401);

    const validationErrors = getPostValidationErrors(title, content, imageUrl);
    if (validationErrors)
      throw errorHandler('Invalid post data.', 422, null, validationErrors);

    const user = await User.findById(req.userId);
    if (!user) {
      throw errorHandler('No user found.', 401);
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
  updatePost: async function (
    { postId, postInput: { title, content, imageUrl } },
    req
  ) {
    if (!req.userId) throw errorHandler('Not authenticated.', 401);

    const validationErrors = getPostValidationErrors(title, content, imageUrl);
    if (validationErrors)
      throw errorHandler('Invalid post data.', 422, null, validationErrors);
    const post = await Post.findById(postId).populate('creator');
    if (post.creator._id.toString() !== req.userId.toString()) {
      throw errorHandler('You are not authorized to modify this post.', 403);
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
  deletePost: async function ({ postId }, req) {
    if (!req.userId) throw errorHandler('Not authenticated.', 401);

    const post = await Post.findById(postId);
    if (!post) {
      throw errorHandler('No post with that ID found.', 404);
    }
    if (post.creator.toString() !== req.userId.toString()) {
      throw errorHandler('You are not authorized to delete this post.', 403);
    }
    const user = await User.findById(req.userId);
    user.posts = user.posts.filter(
      post => post._id.toString() !== postId.toString()
    );
    await user.save();
    await Post.deleteOne({ _id: postId }, err => {
      if (err) {
        throw errorHandler('Failed to delete post.', 404);
      }
      console.log(`Post: ${postId} deleted successfully.`);
    });

    return {
      postId: postId,
    };
  },
  getPosts: async function ({ page }, req) {
    if (!req.userId) {
      throw errorHandler('Not Authenticated.', 401);
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
    if (!req.userId) {
      throw errorHandler('Not Authenticated.', 401);
    }
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      throw errorHandler('No post found', 404);
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  getStatus: async function (args, req) {
    if (!req.userId) {
      throw errorHandler('Not Authenticated.', 401);
    }
    const user = await User.findById(req.userId);
    if (!user) {
      throw errorHandler('No user with that ID found.', 404);
    }
    return {
      status: user.status,
    };
  },
  updateStatus: async function ({ statusInput: { status } }, req) {
    if (!req.userId) {
      throw errorHandler('Not Authenticated.', 401);
    }
    const user = await User.findById(req.userId);
    if (!user) {
      throw errorHandler('No user with that ID found.');
    }
    user.status = status;
    const savedUser = await user.save();
    return {
      status: savedUser.status,
    };
  },
};
