/**
 * @file global_error_middleware.js
 * @brief Red de contención global: traduce errores técnicos a respuestas JSON amigables.
 * @project Consultora Médica
 */

const i18n = require('../utils/i18n/i18n');

const globalErrorMiddleware = (err, req, res, next) => {
    console.error('[Error Handler] Detalle:', err.stack || err);

    if (err.code) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: i18n.getMessage('CT_MYSQL_ER_DUP_ENTRY') });
        }
        if (err.code === 'ECONNREFUSED') {
            return res.status(500).json({ message: i18n.getMessage('CT_MYSQL_ECONNREFUSED') });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: i18n.getMessage('CT_MYSQL_FK') });
        }
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: i18n.getMessage('CT_MYSQL_ROW_REFERENCED') });
        }
        if (err.code === 'ER_SIGNAL_EXCEPTION') {
            if (err.sqlMessage === 'FECHA_PASADA') {
                return res.status(409).json({ message: i18n.getMessage('CT_TURNO_VENCIDO') });
            }
            return res.status(409).json({ message: i18n.getMessage('CT_TURNO_NO_DISPONIBLE') });
        }
    }

    const statusCode = err.statusCode || 500;
    const message = i18n.getMessage('CT_ERR_INTERNAL');

    res.status(statusCode).json({
        message: statusCode === 500 ? message : err.message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = globalErrorMiddleware;
