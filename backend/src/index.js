import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cron from 'node-cron';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mainRouter from './api/index.js';
import errorHandler from './middleware/errorHandler.js';
import { requestLogger, logger } from './utils/logger.js';
import { runDailyTrendsJob } from './services/trends.service.js';
import { supabaseAdmin } from './config/supabaseClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Cabeceras de seguridad Helmet (XSS, Clickjacking, Content Sniffing, etc.)
app.use(helmet());

// Middleware de logging
app.use(requestLogger);

// Configuración adaptativa de CORS para producción y desarrollo local
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir llamadas sin origen (ej: curl, scripts internos del cron o apps móviles)
    if (!origin) return callback(null, true);
    
    // Permitir automáticamente cualquier subdominio de Vercel (*.vercel.app) para previsualizaciones y producción
    const isVercel = origin.endsWith('.vercel.app') || origin === 'https://vercel.app';
    
    if (allowedOrigins.indexOf(origin) !== -1 || isVercel || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por políticas CORS de producción.'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Parsea cuerpos de petición capturando el Buffer crudo para la validación criptográfica de firmas de webhooks
app.use(express.json({
  verify: (req, _res, buf) => {
    if (buf && buf.length) {
      req.rawBody = buf;
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

// Rate Limiters para evitar abusos y mitigar ataques de denegación de servicio (DoS)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 300 : 3000, // Límite amplio para evitar falsos positivos
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes desde esta IP, por favor inténtalo más tarde.' }
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: process.env.NODE_ENV === 'production' ? 40 : 400, // Límite prudente para consultas costosas de OpenAI / Gemini
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Límite de solicitudes de IA excedido. Por favor, espera unos minutos.' }
});

// Aplicar Rate Limits de forma estratégica
app.use('/api/', generalLimiter);
app.use('/api/v1/ai', aiLimiter);
app.use('/api/v1/clients/:clientId/chat', aiLimiter);


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

    // ────────────────────────────────────────────────────
    // Cron job diario de tendencias — se ejecuta a las 7:00 AM (hora del servidor)
    // ────────────────────────────────────────────────────
    if (process.env.TAVILY_API_KEY) {
        cron.schedule('0 8 * * *', async () => {
            logger.server('⏰ [cron] Ejecutando job diario de tendencias...');
            try {
                const result = await runDailyTrendsJob();
                logger.server(`✅ [cron] Tendencias completadas — ${result.processed} reportes, ${result.errors} errores.`);
            } catch (err) {
                logger.server(`❌ [cron] Error en job de tendencias: ${err.message}`);
            }
        }, {
            timezone: 'America/Argentina/Buenos_Aires',
        });

        logger.server('📅 [cron] Job de tendencias programado para las 8:00 AM (America/Argentina/Buenos_Aires).');

        // 🚀 Verificación de Catch-up al inicio del servidor
        setTimeout(async () => {
            logger.server('🔍 [startup] Verificando si es necesario realizar el escaneo diario de tendencias...');
            try {
                const todayStr = new Date().toISOString().slice(0, 10);
                const { count, error } = await supabaseAdmin
                    .from('trend_reports')
                    .select('*', { count: 'exact', head: true })
                    .gte('generated_at', `${todayStr}T00:00:00.000Z`);

                if (!error && count === 0) {
                    logger.server('⏰ [startup] No se encontraron reportes hoy. Ejecutando escaneo automático de tendencias de catch-up...');
                    const result = await runDailyTrendsJob();
                    logger.server(`✅ [startup] Escaneo automático de catch-up completado — ${result.processed} reportes, ${result.errors} errores.`);
                } else {
                    logger.server('✅ [startup] El escaneo diario ya se realizó hoy o existen reportes. No se requiere catch-up.');
                }
            } catch (err) {
                logger.server(`❌ [startup] Error en verificación de tendencias: ${err.message}`);
            }
        }, 5000); // Se ejecuta a los 5 segundos de iniciar
    } else {
        logger.server('⚠️  TAVILY_API_KEY no configurada — job de tendencias desactivado.');
    }
});
