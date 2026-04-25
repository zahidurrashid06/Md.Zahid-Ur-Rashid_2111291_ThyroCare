function errorHandler(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);

    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'A record with that value already exists.',
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            message: 'Record not found.',
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error.',
    });
}

module.exports = { errorHandler };
