/**
 * @file view_routes.js
 * @brief Enrutador de pantallas HTML del frontend.
 * @project Consultora Médica
 */

const express = require('express');
const router = express.Router();
const path = require('path');

const htmlDir = path.join(__dirname, '../../frontend/html');

router.get('/', (req, res) => res.sendFile(path.join(htmlDir, 'login.html')));
router.get('/login', (req, res) => res.sendFile(path.join(htmlDir, 'login.html')));
router.get('/register', (req, res) => res.sendFile(path.join(htmlDir, 'register.html')));
router.get('/patient', (req, res) => res.sendFile(path.join(htmlDir, 'patient_dashboard.html')));
router.get('/doctor', (req, res) => res.sendFile(path.join(htmlDir, 'doctor_dashboard.html')));
router.get('/analyst', (req, res) => res.sendFile(path.join(htmlDir, 'analyst_dashboard.html')));
router.get('/admin', (req, res) => res.sendFile(path.join(htmlDir, 'admin_dashboard.html')));

// Catch-all 404
router.use((req, res) => {
    if (req.path.includes('.')) {
        return res.status(404).send('Recurso estático no encontrado');
    }
    res.status(404).sendFile(path.join(htmlDir, 'login.html'));
});

module.exports = router;
