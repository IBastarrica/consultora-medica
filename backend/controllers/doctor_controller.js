/**
 * @file doctor_controller.js
 * @brief Controlador del rol Médico: consulta de turnos asignados y modificación de los mismos.
 * @project Consultora Médica
 */

const doctorRepository = require('../repositories/doctor_repository');
const turnoRepository = require('../repositories/turno_repository');
const historiaRepository = require('../repositories/historia_repository');
const i18n = require('../utils/i18n/i18n');

class DoctorController {
    /**
     * @brief Turnos asignados al doctor autenticado (con datos del paciente).
     * @details ?pendientes=1 filtra solo turnos Activos/Confirmados con fecha >= hoy.
     */
    async getTurnos(req, res, next) {
        try {
            await turnoRepository.expireViejos();

            const doctor = await doctorRepository.findByUser(req.userId);
            if (!doctor) {
                const message = i18n.getMessage('CT_DOCTOR_NO_PROFILE');
                return res.status(404).json({ message });
            }

            const soloPendientes = req.query.pendientes === '1' ? 1 : 0;
            const turnos = await turnoRepository.findByDoctor(doctor.id_doctor, soloPendientes);
            res.json(turnos);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Historia clínica + ficha del paciente (solo si tiene turno con este doctor).
     */
    async getHistoriaPaciente(req, res, next) {
        try {
            const doctor = await doctorRepository.findByUser(req.userId);
            if (!doctor) {
                const message = i18n.getMessage('CT_DOCTOR_NO_PROFILE');
                return res.status(404).json({ message });
            }

            const historia = await historiaRepository.findForDoctor(
                Number(req.params.id), doctor.id_doctor
            );

            if (!historia) {
                const message = i18n.getMessage('CT_HISTORIA_SIN_ACCESO');
                return res.status(404).json({ message });
            }

            res.json(historia);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Descarga la historia clínica como archivo .txt (mismo control de acceso).
     */
    async descargarHistoria(req, res, next) {
        try {
            const doctor = await doctorRepository.findByUser(req.userId);
            if (!doctor) {
                const message = i18n.getMessage('CT_DOCTOR_NO_PROFILE');
                return res.status(404).json({ message });
            }

            const h = await historiaRepository.findForDoctor(
                Number(req.params.id), doctor.id_doctor
            );

            if (!h) {
                const message = i18n.getMessage('CT_HISTORIA_SIN_ACCESO');
                return res.status(404).json({ message });
            }

            const lineas = [
                '==================================================',
                '            HISTORIA CLÍNICA - CONSULTORA MÉDICA',
                '==================================================',
                '',
                `Paciente: ${[h.nombre, h.apellido].filter(Boolean).join(' ')}`,
                `Usuario: ${h.username}`,
                `Email: ${h.email || '-'}`,
                `Edad: ${h.edad !== null ? h.edad : '-'}`,
                `Ciudad: ${h.ciudad || '-'}`,
                `Nacionalidad: ${h.nacionalidad || '-'}`,
                `Fecha de nacimiento: ${h.fecha_nacimiento || '-'}`,
                '',
                '--- Datos clínicos ---',
                `Grupo sanguíneo: ${h.grupo_sanguineo || '-'}`,
                `Alergias: ${h.alergias || '-'}`,
                `Medicación actual: ${h.medicacion_actual || '-'}`,
                `Antecedentes: ${h.antecedentes || '-'}`,
                `Observaciones: ${h.observaciones || '-'}`,
                `Última actualización: ${h.fecha_actualizacion || '-'}`,
                '',
                `Generado por ${doctor.nombre} (${doctor.especialidad}) - Consultora Médica`
            ];

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="historia_${h.username}.txt"`);
            res.send(lineas.join('\n'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Modifica un turno propio: estado, hora, tiempo estimado y notas.
     */
    async updateTurno(req, res, next) {
        try {
            const doctor = await doctorRepository.findByUser(req.userId);
            if (!doctor) {
                const message = i18n.getMessage('CT_DOCTOR_NO_PROFILE');
                return res.status(404).json({ message });
            }

            const { id } = req.params;
            const { estado, hora_turno, notas, tiempo_atencion_real_min } = req.body;

            const tiempoReal = tiempo_atencion_real_min !== undefined && tiempo_atencion_real_min !== null &&
                String(tiempo_atencion_real_min).trim() !== ''
                ? parseFloat(tiempo_atencion_real_min)
                : null;

            const affected = await turnoRepository.updateByDoctor(
                id, doctor.id_doctor, estado, hora_turno, notas || null, tiempoReal
            );

            if (affected === 0) {
                const message = i18n.getMessage('CT_TURNO_NOT_FOUND');
                return res.status(404).json({ message });
            }

            const message = i18n.getMessage('CT_TURNO_UPDATED');
            res.json({ message });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DoctorController();
