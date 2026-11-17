/**
 * @file db_check.js
 * @brief Diagnóstico CLI de conectividad y estado de la base de datos.
 * @project Consultora Médica
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    console.log('=================================================');
    console.log('  DIAGNÓSTICO DE BASE DE DATOS');
    console.log('=================================================');

    console.log('Configuración del .env:');
    console.log(`- HOST: ${process.env.DB_HOST}`);
    console.log(`- USER: ${process.env.DB_USER}`);
    console.log(`- PASS: ${process.env.DB_PASS ? '****' : '(vacío)'}`);
    console.log(`- NAME: ${process.env.DB_NAME}`);
    console.log('-------------------------------------------------');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        console.log('  CONEXIÓN EXITOSA con las credenciales del .env.');

        const [users] = await connection.query('SELECT id, username FROM users');
        console.log('  Usuarios en la tabla:', users);

        const [roles] = await connection.query('SELECT * FROM roles');
        console.log('  Roles cargados:', roles);

        const [consultas] = await connection.query('SELECT COUNT(*) AS n FROM consultas');
        console.log('  Consultas cargadas:', consultas);

        await connection.end();
    } catch (err) {
        console.error('  ERROR CON CREDENCIALES DEL .ENV:', err.message);
        console.log('\n  Probando diagnóstico alternativo con usuario root (sin contraseña)...');
        try {
            const rootConnection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: 'root',
                password: ''
            });
            console.log('  CONEXIÓN COMO ROOT EXITOSA.');

            const [dbRows] = await rootConnection.query("SHOW DATABASES LIKE 'consultora_medica_web'");
            if (dbRows.length === 0) {
                console.log("  La base de datos 'consultora_medica_web' NO existe. Ejecuta: npm run db:setup");
            } else {
                console.log("  La base de datos 'consultora_medica_web' existe.");
            }
            await rootConnection.end();
        } catch (rootErr) {
            console.error('  Falló la conexión alternativa como root:', rootErr.message);
            console.log('\n  Asegúrate de que MariaDB/MySQL esté activo.');
        }
    }
}

test();
