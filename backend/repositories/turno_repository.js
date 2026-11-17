/**
 * @file turno_repository.js
 * @brief Repositorio de acceso a datos de turnos (Repository Pattern + Stored Procedures).
 * @project Consultora Médica
 */

const db = require('../config/db');

class TurnoRepository {
    async create(idPaciente, idDoctor, fecha, hora, tiempoEstimado, cooldownMin) {
        const [rows] = await db.execute('CALL sp_create_turno(?, ?, ?, ?, ?, ?)',
            [idPaciente, idDoctor, fecha, hora, tiempoEstimado, cooldownMin]);
        return rows[0][0].insertId;
    }

    async findByPatient(idPaciente) {
        const [rows] = await db.execute('CALL sp_find_turnos_by_patient(?)', [idPaciente]);
        return rows[0];
    }

    async findByDoctor(idDoctor, soloPendientes = 0) {
        const [rows] = await db.execute('CALL sp_find_turnos_by_doctor(?, ?)', [idDoctor, soloPendientes]);
        return rows[0];
    }

    async findAll() {
        const [rows] = await db.execute('CALL sp_find_all_turnos()');
        return rows[0];
    }

    async updateByDoctor(idTurno, idDoctor, estado, hora, notas, tiempoReal) {
        const [rows] = await db.execute('CALL sp_update_turno_medico(?, ?, ?, ?, ?, ?)',
            [idTurno, idDoctor, estado, hora, notas, tiempoReal]);
        return rows[0][0].affected;
    }

    async findAllAnalisis() {
        const [rows] = await db.execute('CALL sp_find_turnos_analisis()');
        return rows[0];
    }

    async cancelByPatient(idTurno, idPaciente) {
        const [rows] = await db.execute('CALL sp_cancel_turno_patient(?, ?)', [idTurno, idPaciente]);
        return rows[0][0].affected;
    }

    async expireViejos() {
        const [rows] = await db.execute('CALL sp_expirar_turnos_viejos()');
        return rows[0][0].expirados;
    }
}

module.exports = new TurnoRepository();
