const app = require('./app');
const http = require('http');
const { initSocket } = require('./utils/socketService');

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started successfully at ${new Date().toISOString()}`);
  console.log(`Server running on port ${PORT}`);
});
