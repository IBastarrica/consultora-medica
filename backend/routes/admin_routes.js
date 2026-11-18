/**
 * @file admin_routes.js
 * @brief Rutas privadas del rol Administrador (root).
 * @project Consultora Médica
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin_controller');
const { verifyToken, requireRole } = require('../middleware/auth_middleware');
const { validateDoctor, validateRoleUpdate } = require('../middleware/validation_middleware');

// Cadena de seguridad: token válido + rol admin
router.use(verifyToken, requireRole('admin'));

// Usuarios (soft delete: desactivar/activar en lugar de eliminar)
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', validateRoleUpdate, adminController.updateUserRole);
router.put('/users/:id/desactivar', adminController.deactivateUser);
router.put('/users/:id/activar', adminController.activateUser);

// Doctores
router.get('/doctores', adminController.listDoctores);
router.post('/doctores', validateDoctor, adminController.createDoctor);
router.put('/doctores/:id', validateDoctor, adminController.updateDoctor);
router.delete('/doctores/:id', adminController.deleteDoctor);

// Turnos globales
router.get('/turnos', adminController.getAllTurnos);

// Análisis de datos (misma lógica del Analista)
router.get('/stats/descriptiva', adminController.getDescriptiva);
router.get('/stats/regresion', adminController.getRegresion);
router.get('/stats/turnos-analisis', adminController.getAnalisisTurnos);
router.get('/stats/conclusiones', adminController.getConclusiones);
router.get('/stats/exportar', adminController.exportarExcel);

module.exports = router;
