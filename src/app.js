const express = require('express');
const parkingRoutes = require('./routes/parkingRoutes');
const { AppError } = require('./utils/errors');
const { logger } = require('./utils/logger');

const app = express();

app.use(express.json());

// Routes
app.use('/api', parkingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(message, err.stack);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
});

module.exports = app;
