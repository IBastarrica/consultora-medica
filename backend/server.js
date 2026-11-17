/**
 * @file server.js
 * @brief Punto de entrada principal del Backend Express.
 * @project Consultora Médica
 * @license GNU GPL 3.0
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth_routes');
const patientRoutes = require('./routes/patient_routes');
const doctorRoutes = require('./routes/doctor_routes');
const analystRoutes = require('./routes/analyst_routes');
const adminRoutes = require('./routes/admin_routes');
const viewRoutes = require('./routes/view_routes');

const globalErrorMiddleware = require('./middleware/global_error_middleware');

// Expiración de turnos vencidos: al arrancar el servidor y luego cada hora
const db = require('./config/db');
const expirarTurnos = () => {
    db.execute('CALL sp_expirar_turnos_viejos()')
        .then(() => console.log('Turnos vencidos actualizados.'))
        .catch(() => {});
};
expirarTurnos();
setInterval(expirarTurnos, 60 * 60 * 1000);

const app = express();

// --- 1. Middlewares de Configuración Global ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 2. Servidor Estático del Frontend ---
app.use(express.static(path.join(__dirname, '../frontend')));

// --- 3. Registro de Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/analyst', analystRoutes);
app.use('/api/admin', adminRoutes);

// --- 4. Enrutador de Vistas ---
app.use('/', viewRoutes);

// --- 5. Manejador Global de Contingencias (SIEMPRE al final) ---
app.use(globalErrorMiddleware);

// --- 6. Inicialización del Servicio TCP ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('  Consultora Médica (N Capas) listo en:');
    console.log(`  http://localhost:${PORT}`);
    console.log('==========================================');
});
