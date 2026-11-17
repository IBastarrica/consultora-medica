/**
 * @file validation_middleware.js
 * @brief Escudo de validación sintáctica (Fail-Fast) con Validator Fluent.
 * @project Consultora Médica
 */

const Validator = require('../utils/validator/validator');
const Required = require('../utils/validator/rules/required');
const MinLength = require('../utils/validator/rules/min_length');
const PositiveNumber = require('../utils/validator/rules/positive_number');
const InList = require('../utils/validator/rules/in_list');
const DateFormat = require('../utils/validator/rules/date_format');
const TimeFormat = require('../utils/validator/rules/time_format');

const ESTADOS_TURNO = ['Activo', 'Confirmado', 'Atendido', 'Cancelado'];
const ROLES_VALIDOS = ['admin', 'medico', 'analista', 'paciente'];

const validationMiddleware = {
    /**
     * @brief Registro de paciente: credenciales + datos personales y email generado.
     */
    validateRegister: (req, res, next) => {
        const { username, password, edad, nombre, apellido, ciudad, nacionalidad, fecha_nacimiento } = req.body;
        const validator = new Validator();

        try {
            validator.validateThis(username).with(new Required('CT_REQ_USERNAME'));

            validator.validateThis(password)
                .with(new Required('CT_REQ_PASSWORD'))
                .with(new MinLength(6, 'CT_PASS_TOO_SHORT'));

            validator.validateThis(nombre).with(new Required('CT_REQ_NOMBRE_PACIENTE'));
            validator.validateThis(apellido).with(new Required('CT_REQ_APELLIDO'));
            validator.validateThis(ciudad).with(new Required('CT_REQ_CIUDAD'));
            validator.validateThis(nacionalidad).with(new Required('CT_REQ_NACIONALIDAD'));

            validator.validateThis(fecha_nacimiento)
                .with(new Required('CT_REQ_FECHA_NAC'))
                .with(new DateFormat('CT_FECHA_NAC_FORMAT'));

            if (edad !== undefined && edad !== null && String(edad).trim() !== '') {
                validator.validateThis(edad).with(new PositiveNumber('CT_EDAD_POSITIVE'));
            }

            // La fecha de nacimiento no puede ser futura
            const hoy = new Date();
            const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
            if (fecha_nacimiento > hoyStr) {
                throw new Error(validator.i18n.getMessage('CT_FECHA_NAC_FUTURA'));
            }

            next();
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    /**
     * @brief Edición de datos personales del paciente.
     */
    validatePerfilUpdate: (req, res, next) => {
        const { nombre, apellido, ciudad, nacionalidad, fecha_nacimiento, edad } = req.body;
        const validator = new Validator();

        try {
            validator.validateThis(nombre).with(new Required('CT_REQ_NOMBRE_PACIENTE'));
            validator.validateThis(apellido).with(new Required('CT_REQ_APELLIDO'));
            validator.validateThis(ciudad).with(new Required('CT_REQ_CIUDAD'));
            validator.validateThis(nacionalidad).with(new Required('CT_REQ_NACIONALIDAD'));

            validator.validateThis(fecha_nacimiento)
                .with(new Required('CT_REQ_FECHA_NAC'))
                .with(new DateFormat('CT_FECHA_NAC_FORMAT'));

            if (edad !== undefined && edad !== null && String(edad).trim() !== '') {
                validator.validateThis(edad).with(new PositiveNumber('CT_EDAD_POSITIVE'));
            }

            const hoy = new Date();
            const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
            if (fecha_nacimiento > hoyStr) {
                throw new Error(validator.i18n.getMessage('CT_FECHA_NAC_FUTURA'));
            }

            next();
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    /**
     * @brief Login: presencia mínima de credenciales.
     */
    validateLogin: (req, res, next) => {
        const { username, password } = req.body;
        const validator = new Validator();

        try {
            validator.validateThis(username).with(new Required('CT_REQ_CREDENTIALS'));
            validator.validateThis(password).with(new Required('CT_REQ_CREDENTIALS'));
            next();
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    /**
     * @brief Creación de turno por paciente: doctor, fecha y hora válidos.
     */
    validateTurnoCreate: (req, res, next) => {
        const { id_doctor, fecha_turno, hora_turno } = req.body;
        const validator = new Validator();

        try {
            validator.validateThis(id_doctor).with(new Required('CT_REQ_DOCTOR'));

            validator.validateThis(fecha_turno)
                .with(new Required('CT_REQ_FECHA'))
                .with(new DateFormat('CT_FECHA_FORMAT'));

            validator.validateThis(hora_turno)
                .with(new Required('CT_REQ_HORA'))
                .with(new TimeFormat('CT_HORA_FORMAT'));

            next();
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    /**
     * @brief Actualización de turno por médico: estado y hora válidos, y tiempo real
     *        de atención obligatorio cuando se marca como Atendido.
     */
    validateTurnoUpdate: (req, res, next) => {
        const { estado, hora_turno, tiempo_atencion_real_min } = req.body;
        const validator = new Validator();

        try {
            validator.validateThis(estado)
                .with(new Required('CT_ESTADO_INVALID'))
                .with(new InList(ESTADOS_TURNO, 'CT_ESTADO_INVALID'));

            validator.validateThis(hora_turno)
                .with(new Required('CT_REQ_HORA'))
                .with(new TimeFormat('CT_HORA_FORMAT'));

            if (estado === 'Atendido') {
                validator.validateThis(tiempo_atencion_real_min)
                    .with(new Required('CT_TIEMPO_REAL_REQUIRED'))
                    .with(new PositiveNumber('CT_TIEMPO_POSITIVE'));
            } else if (tiempo_atencion_real_min !== undefined && tiempo_atencion_real_min !== null &&
                String(tiempo_atencion_real_min).trim() !== '') {
                validator.validateThis(tiempo_atencion_real_min).with(new PositiveNumber('CT_TIEMPO_POSITIVE'));
            }

            next();
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    /**
     * @brief Alta/edición de doctor por admin: nombre, especialidad y experiencia válidos.
     */
    validateDoctor: (req, res, next) => {
        const { nombre, especialidad, anios_experiencia } = req.body;
        const validator = new Validator();

        try {
            validator.validateThis(nombre).with(new Required('CT_REQ_NOMBRE'));
            validator.validateThis(especialidad).with(new Required('CT_REQ_ESPECIALIDAD'));
            validator.validateThis(anios_experiencia)
                .with(new Required('CT_EXP_REQUIRED'))
                .with(new PositiveNumber('CT_EXP_POSITIVE'));

            next();
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    /**
     * @brief Cambio de rol por admin: rol dentro de la lista maestra.
     */
    validateRoleUpdate: (req, res, next) => {
        const { role } = req.body;
        const validator = new Validator();

        try {
            validator.validateThis(role)
                .with(new Required('CT_ROL_INVALID'))
                .with(new InList(ROLES_VALIDOS, 'CT_ROL_INVALID'));

            next();
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
};

module.exports = validationMiddleware;
