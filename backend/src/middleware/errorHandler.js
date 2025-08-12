const errorHandler = (err, req, res, next) => {
    console.error('[ERROR HANDLER]:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Ha ocurrido un error inesperado en el servidor.';

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
    });
};

export default errorHandler;
