/**
 * @file auth_controller.js
 * @brief Controlador de identidad: registro de pacientes e inicio de sesión.
 * @project Consultora Médica
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user_repository');
const i18n = require('../utils/i18n/i18n');
const { generarEmailInstitucional } = require('../utils/email_helper/email_helper');
const { SECRET_KEY } = require('../middleware/auth_middleware');

class AuthController {
    /**
     * @brief Registra un usuario con rol 'paciente' y contraseña hasheada.
     */
    async register(req, res, next) {
        try {
            const { username, password, nombre, apellido, ciudad, nacionalidad, fecha_nacimiento } = req.body;
            const edad = req.body.edad ? parseInt(req.body.edad, 10) : null;

            const email = generarEmailInstitucional(nombre, apellido);
            const hashedPassword = await bcrypt.hash(password, 10);

            const userId = await userRepository.create(
                username, hashedPassword, 'paciente', edad,
                nombre, apellido, ciudad, nacionalidad, fecha_nacimiento, email
            );

            const message = i18n.getMessage('CT_AUTH_REGISTER_SUCCESS');
            res.status(201).json({ message, userId, email });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Valida credenciales contra bcrypt y emite un JWT con id y rol.
     */
    async login(req, res, next) {
        try {
            const { username, password } = req.body;

            const user = await userRepository.findByUsername(username);

            if (!user || !(await bcrypt.compare(password, user.password))) {
                const message = i18n.getMessage('CT_AUTH_INVALID_CREDS');
                return res.status(401).json({ message });
            }

            if (Number(user.activo) === 0) {
                const message = i18n.getMessage('CT_AUTH_ACCOUNT_INACTIVE');
                return res.status(403).json({ message });
            }

            const token = jwt.sign(
                { id: user.id, role: user.role, username: user.username },
                SECRET_KEY,
                { expiresIn: '2h' }
            );

            const message = i18n.getMessage('CT_AUTH_LOGIN_SUCCESS');
            res.json({ message, token, role: user.role });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
