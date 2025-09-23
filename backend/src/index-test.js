const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const port = 3102;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Simple test routes without Prisma
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Test server without Prisma running'
  });
});

app.post('/api/test/memory', (req, res) => {
  // Simple memory test
  const data = new Array(1000).fill('test');
  res.json({
    status: 'ok',
    dataLength: data.length,
    memory: process.memoryUsage()
  });
});

app.post('/api/test/concurrent', (req, res) => {
  // Test concurrent request handling
  setTimeout(() => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      pid: process.pid
    });
  }, Math.random() * 100);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Test server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});