const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`Node linked to realtime cluster: ${socket.id}`);

    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined broadcast room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`Node disconnected from cluster: ${socket.id}`);
    });
  });

  return io;
};

const notifyUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

const broadcastToTeam = (teamId, event, data) => {
  if (io) {
    io.to(`team_${teamId}`).emit(event, data);
  }
};

module.exports = { initSocket, notifyUser, broadcastToTeam };
