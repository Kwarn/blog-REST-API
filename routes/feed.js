const feedController = require('../controllers/feed');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

router.get('/posts', feedController.getPosts);
router.post(
  '/post',
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 }),
  ],
  feedController.postPost
);
router.get('/post/:postId', feedController.getPost);
router.put(
  '/post/:postId',
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);
router.delete('/post/:postId', feedController.deletePost);

module.exports = router;
