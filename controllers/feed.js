exports.getPosts = (req, res, next) => {
  res
    .status(200)
    .json({ posts: [{ title: 'first post', content: 'This is the post' }] });
};

exports.postPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  // create in db in future
  res.status(200).json({
    message: 'Post created.',
    post: { id: new Date().toISOString(), title: title, content: content },
  });
};
