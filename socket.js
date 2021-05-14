const errorHandler = require('./util/errorHandler');
let io;
module.exports = {
  init: httpServer => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw errorHandler(new Error('Socket.io not initialized'), 500);
    }
    return io;
  },
};
