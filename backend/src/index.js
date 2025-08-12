import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mainRouter from './api/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares Esenciales
app.use(cors()); // Habilita Cross-Origin Resource Sharing
app.use(express.json()); // Parsea cuerpos de petición en formato JSON
app.use(express.urlencoded({ extended: true })); // Parsea cuerpos de petición con formato urlencoded

// Enrutador Principal de la API
app.use('/api/v1', mainRouter);

// Ruta Raíz
app.get('/', (_req, res) => {
    res.send('API de Software Rambla funcionando.');
});

// Middleware de Manejo de Errores (siempre al final)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
