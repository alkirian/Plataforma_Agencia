import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import mainRouter from './api/index.js';
import errorHandler from './middleware/errorHandler.js';
import { requestLogger, logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de Rate Limiting para prevenir abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Más permisivo en desarrollo
  message: {
    error: 'Demasiadas requests desde esta IP, intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Return rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Disable legacy `X-RateLimit-*` headers
});

// Middleware de seguridad general
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.SUPABASE_URL || "https://*.supabase.co"],
    },
  },
}));

// Middleware de compresión para optimizar respuestas
app.use(compression());

// Rate limiting aplicado globalmente
app.use(limiter);

// Middleware de logging
app.use(requestLogger);

// Configuración de CORS restrictiva para seguridad
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight por 24 horas
};

// Middlewares Esenciales
app.use(cors(corsOptions)); // CORS restrictivo con whitelist
app.use(express.json({ limit: '10mb' })); // Límite de tamaño para prevenir DoS
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Límite de tamaño

// Enrutador Principal de la API
app.use('/api/v1', mainRouter);

// Ruta Raíz
app.get('/', (_req, res) => {
    res.send('API de Cadence funcionando.');
});

// Middleware de Manejo de Errores (siempre al final)
app.use(errorHandler);

app.listen(PORT, () => {
    logger.server(`🚀 Servidor escuchando en http://localhost:${PORT}`, { port: PORT });
});
