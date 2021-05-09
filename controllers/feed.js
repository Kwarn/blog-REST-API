const { validationResult } = require('express-validator');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: '12345',
        title: 'first post 1111',
        content: 'This is the post',
        imageUrl: 'image/duck.jpg',
        creator: {
          name: 'karl',
        },
        createdAt: new Date(),
      },
    ],
  });
};

exports.postPost = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.errors.length) {
    return res.status(422).json({
      message: 'Validation failed, entered data is incorrect',
      errors: errors.array(),
    });
  }
  const title = req.body.title;
  const content = req.body.content;
  // create in db in future
  res.status(200).json({
    message: 'Post created.',
    post: {
      _id: new Date().toISOString(),
      title: title,
      content: content,
      creator: { name: 'Karl' },
      createdAt: new Date(),
    },
  });
};
