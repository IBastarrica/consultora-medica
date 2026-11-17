/**
 * @file patient_controller.js
 * @brief Controlador del rol Paciente: reserva, consulta y cancelación de turnos propios.
 * @project Consultora Médica
 */

const doctorRepository = require('../repositories/doctor_repository');
const turnoRepository = require('../repositories/turno_repository');
const userRepository = require('../repositories/user_repository');
const statsRepository = require('../repositories/stats_repository');
const stats = require('../utils/stats/stats_engine');
const { generarEmailInstitucional } = require('../utils/email_helper/email_helper');
const i18n = require('../utils/i18n/i18n');

class PatientController {
    /**
     * @brief Información personal del paciente autenticado.
     */
    async getPerfil(req, res, next) {
        try {
            const usuario = await userRepository.findById(req.userId);
            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }
            res.json(usuario);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Modifica los datos personales del paciente (regenera el email institucional).
     */
    async updatePerfil(req, res, next) {
        try {
            const { nombre, apellido, ciudad, nacionalidad, fecha_nacimiento } = req.body;
            const edad = req.body.edad ? parseInt(req.body.edad, 10) : null;

            const email = generarEmailInstitucional(nombre, apellido);
            await userRepository.updateProfile(
                req.userId, nombre, apellido, ciudad, nacionalidad, fecha_nacimiento, edad, email
            );

            const message = i18n.getMessage('CT_PERFIL_UPDATED');
            res.json({ message, email });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Lista de doctores disponibles para reservar.
     */
    async getDoctores(req, res, next) {
        try {
            const doctores = await doctorRepository.findAll();
            res.json(doctores);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Turnos del paciente autenticado.
     */
    async getMyTurnos(req, res, next) {
        try {
            await turnoRepository.expireViejos();
            const turnos = await turnoRepository.findByPatient(req.userId);
            res.json(turnos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Reserva un turno estimando la duración con el modelo de regresión del doctor.
     */
    async createTurno(req, res, next) {
        try {
            const { id_doctor, fecha_turno, hora_turno } = req.body;

            // No se puede reservar un turno con fecha anterior a hoy
            const hoy = new Date();
            const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
            if (fecha_turno < hoyStr) {
                const message = i18n.getMessage('CT_TURNO_FECHA_PASADA');
                return res.status(400).json({ message });
            }

            const usuario = await userRepository.findById(req.userId);
            const edadPaciente = usuario && usuario.edad ? usuario.edad : 30;

            // Modelo por doctor si hay datos suficientes (n >= 3), si no modelo global
            let consultas = await statsRepository.findConsultasByDoctor(id_doctor);
            if (consultas.length < 3) {
                consultas = await statsRepository.findConsultas();
            }

            const edades = consultas.map(c => c.edad_paciente);
            const tiempos = consultas.map(c => c.tiempo_atencion_min);
            const modelo = stats.modeloBivariado(edades, tiempos);

            const { yEstimado } = stats.predecirTiempoTurno(modelo.a, modelo.b, edadPaciente);
            const tiempoEstimado = Math.max(5, Math.round(yEstimado * 100) / 100);

            // Cooldown entre turnos derivado del análisis de datos:
            // el error estándar de la estimación (se) es el desvío típico de la predicción,
            // por eso se usa como margen de seguridad entre consultas (mínimo 5 minutos).
            const cooldownMin = Math.max(5, Math.round(modelo.se));

            const idTurno = await turnoRepository.create(
                req.userId, id_doctor, fecha_turno, hora_turno, tiempoEstimado, cooldownMin
            );

            const message = i18n.getMessage('CT_TURNO_CREATED');
            res.status(201).json({ message, id_turno: idTurno });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Cancela un turno propio (solo si está Activo o Confirmado).
     */
    async cancelTurno(req, res, next) {
        try {
            const { id } = req.params;
            const affected = await turnoRepository.cancelByPatient(id, req.userId);

            if (affected === 0) {
                const message = i18n.getMessage('CT_TURNO_CANCEL_FORBIDDEN');
                return res.status(404).json({ message });
            }

            const message = i18n.getMessage('CT_TURNO_CANCELLED');
            res.json({ message });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PatientController();
