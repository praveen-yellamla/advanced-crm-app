console.log("--- SYSTEM BOOT SEQUENCE START ---");
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('--- FATAL ERROR DETECTED ---');
  console.error('Type:', err.name);
  console.error('Message:', err.message);
  console.error('Stack Trace:', err.stack);
  console.error('----------------------------');
  
  // If it's just an SMTP error, don't crash the whole server
  if (err.message.includes('SMTP')) {
    console.warn('RECOVERY: Non-fatal SMTP error detected. Maintaining service continuity.');
    return;
  }
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('--- UNHANDLED REJECTION ---');
  console.error('Reason:', reason);
  console.error('---------------------------');
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

// Periodic Agent Invitation Expiration Cleaner (runs every 5 minutes)
const prisma = require('./config/prisma');
setInterval(async () => {
  try {
    const expiredCount = await prisma.agentInvitation.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() }
      },
      data: {
        status: 'expired'
      }
    });
    if (expiredCount.count > 0) {
      console.log(`[BACKGROUND JOB] Marked ${expiredCount.count} expired agent invitations.`);
    }
  } catch (err) {
    console.error('[BACKGROUND JOB FAILURE] Failed to run expired agent invitations cleaner:', err.message);
  }
}, 5 * 60 * 1000);
