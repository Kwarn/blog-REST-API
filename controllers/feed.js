const { validationResult } = require('express-validator');
const Post = require('../models/post');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const errorHandler = require('../util/errorHandler');
const user = require('../models/user');

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then(posts => {
      res.status(200).json({
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch(err => errorHandler(err, 500, next));
};

exports.postPost = (req, res, next) => {
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
  let creator;
  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: req.userId,
  });
  post
    .save()
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then(result => {
      res.status(200).json({
        message: 'Post created.',
        post: post,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch(err => {
      errorHandler(err, 500, next);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        throw errorHandler(new Error('Could not find post.'), 404);
      }
      res.status(200).json({ message: 'post fetched', post: post });
    })
    .catch(err => errorHandler(err, next));
};

exports.updatePost = (req, res, next) => {
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
  Post.findById(postId)
    .then(post => {
      if (!post) {
        throw errorHandler(new Error('No post with that Id found', 404));
      }
      if (post.creator.toString() !== req.userId) {
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
      return post.save();
    })
    .then(result => {
      res
        .status(200)
        .json({ message: 'Post Updated Successfully', post: result });
    })
    .catch(err => errorHandler(err, 500, next));
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      //check logged in user in future
      if (!post) {
        throw errorHandler(new Error('No post with that Id exists', 404));
      }
      if (post.creator.toString() !== req.userId) {
        throw errorHandler(
          new Error('You do not have permission to modify this post', 403)
        );
      }
      clearImage(post.imageUrl);
      return Post.findOneAndRemove(postId);
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Deleted post.' });
    })
    .catch(err => errorHandler(err, 500, next));
};

exports.getStatus = (req, res, next) => {
  console.log(`req.userId`, req.userId);
  User.findById(req.userId)
    .then(user => {
      console.log(user);
      if (!user) {
        throw errorHandler(new Error('No user found'), 403);
      }
      res.status(200).json({ status: user.status });
    })
    .catch(err => {
      errorHandler(err, 403, next);
    });
};

exports.putStatus = (req, res, next) => {
  const newStatus = req.body.status;
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        throw errorHandler(new Error('No user found'), 403);
      }
      user.status = newStatus
      return user.save();
    })
    .then(result => {
      res
        .status(200)
        .json({ message: 'Status update success', status: req.body.status });
    })
    .catch(err => errorHandler(err, 403, next));
};
