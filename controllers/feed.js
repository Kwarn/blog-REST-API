const { validationResult } = require('express-validator');
const Post = require('../models/post');

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
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    imageUrl: 'images/duck.jpeg',
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
