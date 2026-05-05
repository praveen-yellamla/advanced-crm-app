const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [process.env.FRONTEND_URL];

const corsOptions = {
origin: function (origin, callback) {
if (!origin) return callback(null, true);
if (allowedOrigins.includes(origin)) {
return callback(null, true);
} else {
return callback(new Error("CORS blocked: " + origin));
}
},
credentials: true
};

app.use(cors(corsOptions));
// NOTE: Express 5.x uses path-to-regexp v8 which strictly rejects '*' as a route string.
// Using native RegExp /.*/ intercepts all paths flawlessly without crashing the router.
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const managerRoutes = require('./routes/managerRoutes');
const agentRoutes = require('./routes/agentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const coreRoutes = require('./routes/coreRoutes');
const aiRoutes = require('./routes/aiRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const googleRoutes = require('./routes/googleRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/core', coreRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth/google', googleRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/call', require('./routes/callRoutes'));

const prisma = require('./config/prisma');

// Root Health Check (for Render Default)
app.get('/', (req, res) => {
  res.status(200).send('ACRM Service Operational');
});

// API Health route with timestamp logging
app.get('/api/health', (req, res) => {
  console.log('Health check hit at:', new Date().toISOString());
  res.status(200).json({ status: "OK", service: "Advanced CRM" });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

module.exports = app;

