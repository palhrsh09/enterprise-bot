const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const winston = require('winston');
require('dotenv').config();

const routes = require('../routes');
const errorHandler = require('../middleware/errorHandler');
const config = require('../config/app.config');
const dbConfig = require('../config/db.config');
const db = require('../models');
const PubSubClient = require("../services/socket.service");

const app = express();
const server = http.createServer(app);

global.pubsub = new PubSubClient('ws://localhost:4000');
global.pubsub.connect().catch(console.error);

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console(),
  ],
});

// Connect to MongoDB
mongoose.connect(dbConfig.URI, {
  dbName: dbConfig.DB_NAME,
})
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch((err) => logger.error('MongoDB connection error:', err));

// CORS setup
const whitelist = config.CORS_URLS.split(',');
const corsOptions = {
  origin: function (origin, callback) {
    console.log("origin",origin)
     if (!origin || whitelist.includes(origin) || process.env.NODE_ENV === 'DEV') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl} - IP: ${req.ip}`);
  logger.info(`[REQ] ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

console.log("Registering routes...");
routes(app, express);
console.log("Routes registered");

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// Optional 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ message: 'Route not found' });
// });

// Start the server
const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server };
