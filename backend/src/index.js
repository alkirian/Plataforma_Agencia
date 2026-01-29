import express from "express";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import mainRouter from "./api/index.js";
import errorHandler from "./middleware/errorHandler.js";
import { requestLogger, logger } from "./utils/logger.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS - DEBE estar antes de otros middlewares
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // Cache preflight por 24 horas
};

// CORS debe ser el primer middleware para manejar preflight requests
app.use(cors(corsOptions));

// Configuración de Rate Limiting para prevenir abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 100 : 10000, // Muy permisivo en desarrollo
  skip: () => process.env.NODE_ENV !== "production", // Skip en desarrollo
  message: {
    error: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true, // Return rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Disable legacy `X-RateLimit-*` headers
});

// Middleware de seguridad general (después de CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "http://localhost:5173",
          "http://localhost:5174",
          process.env.SUPABASE_URL || "https://*.supabase.co",
        ],
      },
    },
  }),
);

// Middleware de compresión para optimizar respuestas
app.use(compression());

// Rate limiting aplicado globalmente
app.use(limiter);

// Middleware de logging
app.use(requestLogger);

// Middlewares esenciales
app.use(express.json({ limit: "10mb" })); // Límite de tamaño para prevenir DoS
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Límite de tamaño

// Enrutador Principal de la API
app.use("/api/v1", mainRouter);

// Ruta raíz
app.get("/", (_req, res) => {
  res.send("API de Cadence funcionando.");
});

// Middleware de manejo de errores (siempre al final)
app.use(errorHandler);

// Exportar la app para entornos serverless (Vercel)
export default app;

// Solo escuchar en puerto local si no estamos en Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.server(`Servidor escuchando en http://localhost:${PORT}`, {
      port: PORT,
    });
  });
}


