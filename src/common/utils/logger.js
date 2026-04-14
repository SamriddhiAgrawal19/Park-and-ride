const logger = {
  info: (message) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`);
  },
  error: (message, trace = '') => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, trace);
  }
};

module.exports = { logger };
