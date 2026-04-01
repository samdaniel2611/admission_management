require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Handle preflight for all routes
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/campuses', require('./routes/campuses'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/academic-years', require('./routes/academicYears'));
app.use('/api/seat-matrix', require('./routes/seatMatrix'));
app.use('/api/applicants', require('./routes/applicants'));
app.use('/api/admissions', require('./routes/admissions'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Admission Management API running' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;