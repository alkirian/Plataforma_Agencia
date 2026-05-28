import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Log del error con contexto (queda registrado de forma privada y segura en el servidor)
    logger.error('Error en request', err, {
        method: req.method,
        url: req.url,
        userId: req.user?.id,
        statusCode,
        userAgent: req.get('User-Agent')
    });

    // En producción sanitizamos errores 500 para evitar fugas de información de base de datos o stack
    let clientMessage = err.message || 'Ha ocurrido un error inesperado en el servidor.';
    if (statusCode === 500 && isProduction) {
        clientMessage = 'Ha ocurrido un error inesperado en el servidor.';
    }

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: clientMessage,
    });
};

export default errorHandler;
