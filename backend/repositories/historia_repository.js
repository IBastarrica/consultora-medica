/**
 * @file historia_repository.js
 * @brief Repositorio de acceso a historias clínicas (Repository Pattern + Stored Procedures).
 * @project Consultora Médica
 */

const db = require('../config/db');

class HistoriaRepository {
    /**
     * @brief Historia clínica + datos del paciente, solo si tiene al menos un turno
     *        con el doctor solicitante (control de acceso a nivel de datos).
     */
    async findForDoctor(idPaciente, idDoctor) {
        const [rows] = await db.execute('CALL sp_find_historia_para_doctor(?, ?)', [idPaciente, idDoctor]);
        return rows[0][0];
    }
}

module.exports = new HistoriaRepository();
