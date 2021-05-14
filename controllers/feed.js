const { validationResult } = require('express-validator');
const Post = require('../models/post');
const fs = require('fs');

const io = require('../socket');
const path = require('path');
const User = require('../models/user');
const errorHandler = require('../util/errorHandler');
const user = require('../models/user');

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      posts: posts,
      totalItems: totalItems,
    });
  } catch (error) {
    errorHandler(error, 500, next);
  }
};

exports.postPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (errors.errors.length) {
    throw errorHandler(
      new Error('Validation failed, entered data is incorrect'),
      422
    );
  }
  if (!req.file) {
    throw errorHandler(new Error('No image provided'), 422);
  }

  const title = req.body.title;
  const imageUrl = req.file.path;
  const content = req.body.content;
  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: req.userId,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    await user.posts.push(post);
    await user.save();
    io.getIO().emit('posts', {
      action: 'create',
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });
    res.status(200).json({
      message: 'Post created.',
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (error) {
    errorHandler(error, 500, next);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw errorHandler(new Error('Could not find post.'), 404);
    }
    res.status(200).json({ message: 'post fetched', post: post });
  } catch (error) {
    errorHandler(error, 500, next);
  }
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (errors.errors.length) {
    throw errorHandler(
      new Error('Validation failed, entered data is incorrect'),
      422
    );
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    throw errorHandler(new Error('No image file picked'), 422);
  }

  try {
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      throw errorHandler(new Error('No post with that Id found', 404));
    }
    if (post.creator._id.toString() !== req.userId) {
      throw errorHandler(
        new Error('You do not have permission to modify this post', 403)
      );
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    await post.save();
    io.getIO().emit('posts', {
      action: 'update',
      post: post,
    });

    res.status(200).json({ message: 'Post Updated Successfully', post: post });
  } catch (error) {
    errorHandler(error, 500, next);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      throw errorHandler(new Error('No post with that Id exists', 404));
    }
    if (post.creator.toString() !== req.userId) {
      throw errorHandler(
        new Error('You do not have permission to modify this post', 403)
      );
    }

    clearImage(post.imageUrl);
    await Post.findOneAndRemove(postId);
    user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIO().emit('posts', {
      action: 'delete',
      postId: postId,
    });
    res.status(200).json({ message: 'Deleted post.' });
  } catch (error) {
    errorHandler(error, 500, next);
  }
};

exports.getStatus = async (req, res, next) => {
  const user = await User.findById(req.userId);

  try {
    if (!user) {
      throw errorHandler(new Error('No user found'), 403);
    }
    res.status(200).json({ status: user.status });
  } catch (error) {
    errorHandler(error, 403, next);
  }
};

exports.putStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      throw errorHandler(new Error('No user found'), 403);
    }
    user.status = newStatus;
    await user.save();
    res
      .status(200)
      .json({ message: 'Status update success', status: req.body.status });
  } catch (error) {
    errorHandler(error, 403, next);
  }
};
