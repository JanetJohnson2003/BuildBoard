require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const morgan = require('morgan');

const { initializeSocket } = require('./config/socket');
const { allowedClientOrigins } = require('./config/clientOrigins');
const { connectDatabase } = require('./config/database');
const { uploadDir } = require('./config/storage');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'http:', 'https:'],
    },
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  cors({
    origin: allowedClientOrigins,
    credentials: true,
  })
);

app.use('/uploads', express.static(uploadDir));

const ensureDatabase = async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error('MongoDB error:', error.message);
    res.status(503).json({
      message: 'Database connection unavailable',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BuildBoard+ API is running' });
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'BuildBoard+ API is running',
    health: '/health',
  });
});

app.use('/api', ensureDatabase);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/repos', require('./routes/repos'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/pullrequests', require('./routes/pullrequests'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/platform', require('./routes/platform'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/overseer', require('./routes/overseer'));
app.use('/api/godmode', require('./routes/godmode'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/versions', require('./routes/versions'));
app.use('/api/feedback', require('./routes/feedback'));

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

if (require.main === module && !isServerless) {
  const server = http.createServer(app);
  initializeSocket(server);
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`BuildBoard+ Server running on port ${PORT}`);
  });
}

module.exports = app;
