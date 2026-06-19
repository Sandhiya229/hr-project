import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

import connectDB from './src/config/db.js';
import { logger } from './src/utils/logger.js';
import { errorHandler } from './src/middlewares/errorMiddleware.js';

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow frontend to load images served from this backend
}));
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// Normalize origin to 'protocol://host' when possible
const normalizeOrigin = (value) => {
  if (!value) return value;
  try {
    return new URL(value).origin;
  } catch (e) {
    return value;
  }
};

const allowedNormalized = Array.from(new Set(allowedOrigins.filter(Boolean).map(normalizeOrigin)));

// Note: debug logging removed for production; allowedNormalized retained for runtime matching

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests (server-to-server, curl)

    const normalized = normalizeOrigin(origin);
    if (allowedNormalized.includes(normalized)) {
      return callback(null, true);
    }

    console.warn(`CORS denied. Incoming origin: ${origin} (normalized: ${normalized}). Allowed: ${allowedNormalized}`);
    callback(new Error(`CORS policy denied for origin ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
const morganFormat = ':method :url :status :response-time ms - :res[content-length]';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => {
      const logObject = {
        method: message.split(' ')[0],
        url: message.split(' ')[1],
        status: message.split(' ')[2],
        responseTime: message.split(' ')[3],
      };
      logger.info(JSON.stringify(logObject));
    }
  }
}));

// Trust the reverse proxy (Render) so rate limiting works correctly and doesn't crash
app.set('trust proxy', 1);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Increased significantly for development
  standardHeaders: true, 
  legacyHeaders: false,
});
app.use('/api', limiter);

// Placeholder Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running successfully' });
});

// Import Routes
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import employeeRoutes from './src/routes/employeeRoutes.js';

logger.info("Setting up routes");
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/employee', employeeRoutes);

// Error Handling Middleware (must be added after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
