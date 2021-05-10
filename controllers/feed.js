const { validationResult } = require('express-validator');
const Post = require('../models/post');
const fs = require('fs');
const path = require('path');

const errorHandler = (error, statusCode, next = null) => {
  if (!error.statusCode) {
    error.statusCode = statusCode;
  }
  if (next) {
    next(err);
  } else {
    return error;
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};

exports.getPosts = (req, res, next) => {
  Post.find()
    .then(posts => {
      res.status(200).json({
        posts: posts,
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
  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: { name: 'Karl' },
  });
  post
    .save()
    .then(result => {
      res.status(200).json({
        message: 'Post created.',
        post: result,
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
      clearImage(post.imageUrl);
      return Post.findOneAndRemove(postId);
    })
    .then(result => {
      res.status(200).json({ message: 'Deleted post.' });
    })
    .catch(err => errorHandler(err, 500, next));
};
