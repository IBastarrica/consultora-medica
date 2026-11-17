/**
 * @file stats_repository.js
 * @brief Repositorio de acceso a la muestra estadística de consultas.
 * @project Consultora Médica
 */

const db = require('../config/db');

class StatsRepository {
    async findConsultas() {
        const [rows] = await db.execute('CALL sp_find_consultas()');
        return rows[0];
    }

    async findConsultasByDoctor(idDoctor) {
        const [rows] = await db.execute('CALL sp_find_consultas_by_doctor(?)', [idDoctor]);
        return rows[0];
    }
}

module.exports = new StatsRepository();
