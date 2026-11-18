/**
 * @file analyst_routes.js
 * @brief Rutas privadas del rol Analista de Datos.
 * @project Consultora Médica
 */

const express = require('express');
const router = express.Router();
const analystController = require('../controllers/analyst_controller');
const { verifyToken, requireRole } = require('../middleware/auth_middleware');

// Cadena de seguridad: token válido + rol analista
router.use(verifyToken, requireRole('analista'));

router.get('/descriptiva', analystController.getDescriptiva);
router.get('/regresion', analystController.getRegresion);
router.get('/turnos/analisis', analystController.getAnalisisTurnos);
router.get('/conclusiones', analystController.getConclusiones);
router.get('/exportar', analystController.exportarExcel);

module.exports = router;
