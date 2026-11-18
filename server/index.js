const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// Ensure Database Connection for incoming requests (vital for serverless cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection error', error: err.message });
  }
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/daily-plans', require('./routes/dailyPlans'));
app.use('/api/supply-requests', require('./routes/supplyRequests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/workforce-rules', require('./routes/workforceRules'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'LOGISTA API running', env: process.env.NODE_ENV }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// Only listen when running standalone directly from CLI (not when required as a module or in Vercel serverless)
if (require.main === module && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 LOGISTA Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
}

module.exports = app;
