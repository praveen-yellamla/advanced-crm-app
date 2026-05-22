require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ==========================================
// PRIORITY HEALTH CHECKS (For Deployment)
// Must be above all middleware to ensure fast response
// ==========================================
app.get('/', (req, res) => {
  res.status(200).send('ACRM_ACTIVE');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "OK", service: "Advanced CRM", timestamp: new Date() });
});

app.get('/healthz', (req, res) => res.sendStatus(200));

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
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/platform', require('./routes/platformRoutes'));
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
app.use('/api/twilio', require('./routes/callRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));
app.use('/api/email-threads', require('./routes/threadRoutes'));
app.use('/api/email-templates', require('./routes/templateRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

const prisma = require('./config/prisma');

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

module.exports = app;
