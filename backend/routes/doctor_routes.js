/**
 * @file doctor_routes.js
 * @brief Rutas privadas del rol Médico.
 * @project Consultora Médica
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor_controller');
const { verifyToken, requireRole } = require('../middleware/auth_middleware');
const { validateTurnoUpdate } = require('../middleware/validation_middleware');

// Cadena de seguridad: token válido + rol medico
router.use(verifyToken, requireRole('medico'));

router.get('/perfil', doctorController.getPerfil);
router.get('/turnos', doctorController.getTurnos);
router.put('/turnos/:id', validateTurnoUpdate, doctorController.updateTurno);
router.get('/pacientes/:id/historia', doctorController.getHistoriaPaciente);
router.get('/pacientes/:id/historia/descargar', doctorController.descargarHistoria);

module.exports = router;
