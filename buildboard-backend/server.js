require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// ✅ Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/buildboard')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ✅ Routes (ORDER MATTERS!)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/versions', require('./routes/versions'));
app.use('/api/feedback', require('./routes/feedback'));  // ✅ ADD THIS
app.use('/api/admin', require('./routes/admin')); 
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BuildBoard+ API is running' });
});

// ✅ 404 handler
app.use((req, res) => {
  console.log(`⚠️ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ 
    message: 'Internal server error',
    error: err.message 
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ BuildBoard+ Server running on port ${PORT}`);
});