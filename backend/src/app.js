const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const managerRoutes = require('./routes/managerRoutes');
const agentRoutes = require('./routes/agentRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/agent', agentRoutes);

const prisma = require('./config/prisma');

// Health route with DB check
app.get('/api/health', async (req, res) => {
  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'success',
      message: 'Backend server and Database are healthy',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Backend server is up, but Database is DISCONNECTED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
