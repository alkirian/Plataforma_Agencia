import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mainRouter from './api/index.js';
import errorHandler from './middleware/errorHandler.js';
import { requestLogger, logger } from './utils/logger.js';

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
});
