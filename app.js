const express = require('express');
const parkingRoutes = require('./src/parking/routes/parkingRoutes');
const rideRoutes = require('./src/ride/routes/rideRoutes');
const { AppError } = require('./src/common/utils/errors');
const { logger } = require('./src/common/utils/logger');

const app = express();

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Park and Ride API is running');
});
app.use('/api', parkingRoutes);
app.use('/v1', rideRoutes);

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
