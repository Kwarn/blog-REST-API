const feedController = require('../controllers/feed');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const isAuth = require('../middleware/isAuth');

router.get('/posts', isAuth, feedController.getPosts);
router.post(
  '/post',
  isAuth,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 }),
  ],
  feedController.postPost
);
router.get('/post/:postId', isAuth, feedController.getPost);
router.put(
  '/post/:postId',
  isAuth,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);
router.delete('/post/:postId', isAuth, feedController.deletePost);
router.get('/status', isAuth, feedController.getStatus);
router.put(
  '/status',
  [body('status').trim().not().isEmpty()],
  isAuth,
  feedController.putStatus
);

module.exports = router;
