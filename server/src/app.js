/**
 * Express App Entry Point
 * Main server file - integrates upload routes
 */
// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const videoUploadRouter = require('./uploads/routes/video-upload');
const { startCleanupCron } = require('./uploads/cron/cleanup-uploads');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;



// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root: API info (so http://localhost:3000 shows something useful)
app.get('/', (req, res) => {
  res.json({
    name: 'ArbanTV Upload API',
    version: '1.0.0',
    docs: {
      health: 'GET /health',
      init: 'POST /api/uploads/init',
      chunk: 'POST /api/uploads/:id/chunk',
      complete: 'POST /api/uploads/:id/complete',
      status: 'GET /api/uploads/:id/status',
      cancel: 'DELETE /api/uploads/:id',
    },
    health: 'GET /health',
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '../public')));

// Upload routes
app.use('/api/uploads', videoUploadRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 ArbanTV Upload Server running on port ${PORT}`);
    console.log(`📡 Upload API: http://localhost:${PORT}/api/uploads`);
    
    // Start cleanup cron job
    startCleanupCron();
  });
}

module.exports = app;
