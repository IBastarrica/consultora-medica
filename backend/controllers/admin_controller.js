/**
 * @file admin_controller.js
 * @brief Controlador del rol Administrador (root): gestión de usuarios, doctores,
 *        turnos globales y acceso al análisis de datos.
 * @project Consultora Médica
 */

const userRepository = require('../repositories/user_repository');
const doctorRepository = require('../repositories/doctor_repository');
const turnoRepository = require('../repositories/turno_repository');
const analystController = require('./analyst_controller');
const i18n = require('../utils/i18n/i18n');

class AdminController {
    // ---------- Usuarios ----------

    async getAllUsers(req, res, next) {
        try {
            const users = await userRepository.findAll();
            res.json(users);
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req, res, next) {
        try {
            const targetUserId = Number(req.params.id);
            const { role } = req.body;

            if (targetUserId === req.userId) {
                const message = i18n.getMessage('CT_ADMIN_CANT_CHANGE_SELF');
                return res.status(403).json({ message });
            }

            await userRepository.updateRole(targetUserId, role);

            const message = i18n.getMessage('CT_ADMIN_ROLE_UPDATED');
            res.json({ message });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Desactiva un usuario (soft delete): conserva sus datos históricos y bloquea el login.
     */
    async deactivateUser(req, res, next) {
        try {
            const targetUserId = Number(req.params.id);

            if (targetUserId === req.userId) {
                const message = i18n.getMessage('CT_ADMIN_CANT_DEACTIVATE_SELF');
                return res.status(403).json({ message });
            }

            const affected = await userRepository.deactivate(targetUserId);

            if (affected === 0) {
                const message = i18n.getMessage('CT_ADMIN_USER_NOT_FOUND');
                return res.status(404).json({ message });
            }

            const message = i18n.getMessage('CT_ADMIN_USER_DEACTIVATED');
            res.json({ message });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Reactiva una cuenta desactivada.
     */
    async activateUser(req, res, next) {
        try {
            const targetUserId = Number(req.params.id);

            const affected = await userRepository.activate(targetUserId);

            if (affected === 0) {
                const message = i18n.getMessage('CT_ADMIN_USER_NOT_FOUND');
                return res.status(404).json({ message });
            }

            const message = i18n.getMessage('CT_ADMIN_USER_ACTIVATED');
            res.json({ message });
        } catch (error) {
            next(error);
        }
    }

    // ---------- Doctores ----------

    async listDoctores(req, res, next) {
        try {
            const doctores = await doctorRepository.findAll();
            res.json(doctores);
        } catch (error) {
            next(error);
        }
    }

    async createDoctor(req, res, next) {
        try {
            const { nombre, especialidad, anios_experiencia, user_id } = req.body;
            const idDoctor = await doctorRepository.create(
                nombre, especialidad, parseInt(anios_experiencia, 10),
                user_id ? parseInt(user_id, 10) : null
            );

            const message = i18n.getMessage('CT_DOCTOR_CREATED');
            res.status(201).json({ message, id_doctor: idDoctor });
        } catch (error) {
            next(error);
        }
    }

    async updateDoctor(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, especialidad, anios_experiencia, user_id } = req.body;

            const affected = await doctorRepository.update(
                Number(id), nombre, especialidad, parseInt(anios_experiencia, 10),
                user_id ? parseInt(user_id, 10) : null
            );

            if (affected === 0) {
                const message = i18n.getMessage('CT_DOCTOR_NOT_FOUND');
                return res.status(404).json({ message });
            }

            const message = i18n.getMessage('CT_DOCTOR_UPDATED');
            res.json({ message });
        } catch (error) {
            next(error);
        }
    }

    async deleteDoctor(req, res, next) {
        try {
            const { id } = req.params;
            await doctorRepository.delete(Number(id));

            const message = i18n.getMessage('CT_DOCTOR_DELETED');
            res.json({ message });
        } catch (error) {
            next(error);
        }
    }

    // ---------- Turnos globales ----------

    async getAllTurnos(req, res, next) {
        try {
            await turnoRepository.expireViejos();
            const turnos = await turnoRepository.findAll();
            res.json(turnos);
        } catch (error) {
            next(error);
        }
    }

    // ---------- Análisis de datos (misma lógica que el Analista) ----------

    getDescriptiva(req, res, next) {
        return analystController.getDescriptiva(req, res, next);
    }

    getRegresion(req, res, next) {
        return analystController.getRegresion(req, res, next);
    }

    getRegresionDoctor(req, res, next) {
        return analystController.getRegresionDoctor(req, res, next);
    }

    getAnalisisTurnos(req, res, next) {
        return analystController.getAnalisisTurnos(req, res, next);
    }

    exportarExcel(req, res, next) {
        return analystController.exportarExcel(req, res, next);
    }
}

module.exports = new AdminController();
