/**
 * @file db_setup.js
 * @brief Inicialización automatizada de la base de datos (Bootstrap DB).
 * @project Consultora Médica
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log('=================================================');
    console.log('  Consultora Médica - Inicializando Base de Datos');
    console.log('=================================================');

    const host = process.env.DB_HOST || 'localhost';
    const rootUser = process.env.ROOT_USER || 'root';
    const rootPass = process.env.ROOT_PASS || '';

    let connection;
    try {
        connection = await mysql.createConnection({
            host,
            user: rootUser,
            password: rootPass,
            multipleStatements: true
        });

        const sqlPath = path.join(__dirname, '../../config/init.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('  Leyendo init.sql y limpiando sintaxis DELIMITER...');

        const sqlClean = sqlContent
            .replace(/DELIMITER\s+\/\/+/gi, '')
            .replace(/DELIMITER\s+;+/gi, '')
            .replace(/\/\//g, ';');

        await connection.query(sqlClean);
        console.log('  Base de datos consultora_medica_web creada y configurada exitosamente.');
    } catch (error) {
        console.error('  Error al configurar la base de datos:');
        console.error(error.message);
        console.log('\n  Importa manualmente backend/config/init.sql desde phpMyAdmin o el cliente de MariaDB.');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

run();
