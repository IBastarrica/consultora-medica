/**
 * @file auth_middleware.js
 * @brief Autenticación JWT y control de acceso por roles (RBAC).
 * @project Consultora Médica
 */

const jwt = require('jsonwebtoken');
const i18n = require('../utils/i18n/i18n');
const userRepository = require('../repositories/user_repository');

const SECRET_KEY = process.env.JWT_SECRET;

const authMiddleware = {
    SECRET_KEY,

    /**
     * @brief Valida la firma y vigencia del token Bearer e inyecta req.userId y req.userRole.
     */
    verifyToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const message = i18n.getMessage('CT_AUTH_TOKEN_FORMAT');
            return res.status(403).json({ message });
        }

        const pureToken = authHeader.split(' ')[1];

        jwt.verify(pureToken, SECRET_KEY, (err, decoded) => {
            if (err) {
                const message = i18n.getMessage('CT_AUTH_TOKEN_INVALID');
                return res.status(401).json({ message });
            }

            // El usuario debe existir y estar activo (soft delete)
            userRepository.findById(decoded.id)
                .then(user => {
                    if (!user) {
                        return res.status(401).json({ message: i18n.getMessage('CT_AUTH_TOKEN_INVALID') });
                    }
                    if (Number(user.activo) === 0) {
                        return res.status(401).json({ message: i18n.getMessage('CT_AUTH_ACCOUNT_INACTIVE') });
                    }
                    req.userId = decoded.id;
                    req.userRole = decoded.role;
                    next();
                })
                .catch(() => res.status(500).json({ message: i18n.getMessage('CT_ERR_INTERNAL') }));
        });
    },

    /**
     * @brief Filtro RBAC: solo deja pasar a los roles permitidos.
     * @param {...string} roles - Roles autorizados (ej: 'admin', 'analista').
     */
    requireRole: (...roles) => (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            const message = i18n.getMessage('CT_AUTH_ROLE_REQUIRED');
            return res.status(403).json({ message });
        }
        next();
    }
};

module.exports = authMiddleware;
