/**
 * @file db.js
 * @brief Pool de conexiones a MariaDB/MySQL (mysql2/promise).
 * @project Consultora Médica
 */

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
});

module.exports = pool.promise();
