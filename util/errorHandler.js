const errorHandler = (
  error,
  statusCode,
  next = null,
  errorDataArray = null
) => {
  if (!error.statusCode) {
    if (statusCode) {
      error.statusCode = statusCode;
    } else {
      error.statusCode = 500;
    }
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
