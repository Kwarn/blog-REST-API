const jwt = require('jsonwebtoken');
const errorHandler = require('../util/errorHandler');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    throw errorHandler(new Error('No Authorization Header Found'), 401);
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'someSuperSecretSecret');
  } catch (err) {
    throw errorHandler(err, 500);
  }
  if (!decodedToken) {
    throw errorHandler(new Error('Not Authenticated.'), 401);
  }
  req.userId = decodedToken.userId;
  next();
};
