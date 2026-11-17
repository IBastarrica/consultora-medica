/**
 * @file doctor_repository.js
 * @brief Repositorio de acceso a datos de doctores (Repository Pattern + Stored Procedures).
 * @project Consultora Médica
 */

const db = require('../config/db');

class DoctorRepository {
    async findAll() {
        const [rows] = await db.execute('CALL sp_find_doctores()');
        return rows[0];
    }

    async findByUser(userId) {
        const [rows] = await db.execute('CALL sp_find_doctor_by_user(?)', [userId]);
        return rows[0][0];
    }

    async create(nombre, especialidad, aniosExperiencia, userId = null) {
        const [rows] = await db.execute('CALL sp_create_doctor(?, ?, ?, ?)',
            [nombre, especialidad, aniosExperiencia, userId]);
        return rows[0][0].insertId;
    }

    async update(id, nombre, especialidad, aniosExperiencia, userId = null) {
        const [rows] = await db.execute('CALL sp_update_doctor(?, ?, ?, ?, ?)',
            [id, nombre, especialidad, aniosExperiencia, userId]);
        return rows[0][0].affected;
    }

    async delete(id) {
        await db.execute('CALL sp_delete_doctor(?)', [id]);
        return true;
    }
}

module.exports = new DoctorRepository();
