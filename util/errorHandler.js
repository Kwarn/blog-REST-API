const errorHandler = (
  error,
  statusCode,
  next = null,
  errorDataArray = null
) => {
  if (!error.statusCode) {
    error.statusCode = statusCode;
  }
  if (errorDataArray) {
    error.data = errorDataArray;
  }
  if (next) {
    next(error);
  } else {
    return error;
  }
};

module.exports = errorHandler;
