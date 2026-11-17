/**
 * @file patient_routes.js
 * @brief Rutas privadas del rol Paciente.
 * @project Consultora Médica
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient_controller');
const { verifyToken, requireRole } = require('../middleware/auth_middleware');
const { validateTurnoCreate, validatePerfilUpdate } = require('../middleware/validation_middleware');

// Cadena de seguridad: token válido + rol paciente
router.use(verifyToken, requireRole('paciente'));

router.get('/perfil', patientController.getPerfil);
router.put('/perfil', validatePerfilUpdate, patientController.updatePerfil);
router.get('/doctores', patientController.getDoctores);
router.get('/turnos', patientController.getMyTurnos);
router.post('/turnos', validateTurnoCreate, patientController.createTurno);
router.post('/turnos/:id/cancelar', patientController.cancelTurno);

module.exports = router;
