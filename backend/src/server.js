console.log("--- SYSTEM BOOT SEQUENCE START ---");

process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception during boot:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = require('./app');
const http = require('http');
const { initSocket } = require('./utils/socketService');

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`--- NETWORK INTERFACE ONLINE ---`);
  console.log(`Service binding successful on: 0.0.0.0:${PORT}`);
  console.log(`External Pulse Detection: ACTIVE`);
  console.log(`Runtime Environment: ${process.env.NODE_ENV || 'development'}`);
});
