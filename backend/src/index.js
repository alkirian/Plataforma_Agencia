import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cron from 'node-cron';
import mainRouter from './api/index.js';
import errorHandler from './middleware/errorHandler.js';
import { requestLogger, logger } from './utils/logger.js';
import { runDailyTrendsJob } from './services/trends.service.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de logging
app.use(requestLogger);

// Middlewares Esenciales
app.use(cors()); // Habilita Cross-Origin Resource Sharing
app.use(express.json()); // Parsea cuerpos de petición en formato JSON
app.use(express.urlencoded({ extended: true })); // Parsea cuerpos de petición con formato urlencoded

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
        cron.schedule('0 7 * * *', async () => {
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

        logger.server('📅 [cron] Job de tendencias programado para las 7:00 AM (America/Argentina/Buenos_Aires).');
    } else {
        logger.server('⚠️  TAVILY_API_KEY no configurada — job de tendencias desactivado.');
    }
});
