import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
// Load environment variables
dotenv.config();

// Import configurations
import './config/passport';
import apiRoutes from './routes';
// Logger imported but not used in main file
// import logger from './utils/logger';
import startUserCleanupJob from './jobs/userCleanup';
import prisma from './config/database';

const app = express();
const port = parseInt(process.env.PORT || '3101', 10);

// Rate limiting to prevent segfaults from concurrent requests
const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 20, // limit each IP to 20 requests per second
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Get allowed origins from environment variable
    const corsOrigin = process.env.CORS_ORIGIN;

    // Allow all origins if CORS_ORIGIN is "*"
    if (corsOrigin === '*') {
      return callback(null, true);
    }

    if (corsOrigin && origin === corsOrigin) {
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin && origin.includes('localhost')) {
      return callback(null, true);
    }

    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handlers for uncaught exceptions and promise rejections
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION - This may cause server crash:');
  console.error('Error:', error.name, '-', error.message);
  console.error('Stack:', error.stack);
  console.error('Time:', new Date().toISOString());
  // Don't exit immediately, log the error and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED PROMISE REJECTION - This may cause server crash:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('Time:', new Date().toISOString());
  // Don't exit immediately, log the error and continue
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🔗 Network access: http://0.0.0.0:${port}/api/health`);

  // Start cron jobs only if enabled
  if (process.env.ENABLE_CRON_JOBS === 'true') {
    startUserCleanupJob();
    console.log(`⏰ Cron jobs initialized`);
  } else {
    console.log(`⏰ Cron jobs disabled`);
  }
});

export default app;