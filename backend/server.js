const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const sheetRoutes = require('./routes/sheets');
const levelAccessRoutes = require('./routes/levelAccess');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500'
  'https://astounding-heliotrope-3bc097.netlify.app'
  process.env.FRONTEND_URL
].filter(Boolean);

const originValidator = (origin, callback) => {
  if (!origin) return callback(null, true); // non-browser or same-origin
  const isAllowed =
    allowedOrigins.includes(origin) ||
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5500$/.test(origin) ||
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:5500$/.test(origin) ||
    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:5500$/.test(origin);
  callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
};

app.use(cors({
  origin: originValidator,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/level-access', levelAccessRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BrainsterMath API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 BrainsterMath E-Learning Platform API`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
