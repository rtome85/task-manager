const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

//Import routes 
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

//Security middleware
app.use(helmet({
  constentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", 'unsafe-inline'],
    },
  }
}));

//CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'
    : ['http://localhost:3000', 'localhost:3001'],
  credentials: true,
}));

//Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 60000) // in minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: (req) => process.env.NODE_ENV === 'test',
});

app.use(limiter);

//Body parsing middleware
app.use(express.json({ limit: '10mb' })); // limit body to 10mb
app.use(express.urlencoded({ extended: true }));

//Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timeestamp: new Date().toISOString()
  });
  next();
});

//Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

//API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

//404 handler 
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

//Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
