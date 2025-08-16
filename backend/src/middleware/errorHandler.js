import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Ha ocurrido un error inesperado en el servidor.';
    
    // Log del error con contexto
    logger.error('Error en request', err, {
        method: req.method,
        url: req.url,
        userId: req.user?.id,
        statusCode,
        userAgent: req.get('User-Agent')
    });

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
    });
};

export default errorHandler;
