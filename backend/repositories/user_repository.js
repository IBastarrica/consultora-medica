/**
 * @file user_repository.js
 * @brief Repositorio de acceso a datos de usuarios (Repository Pattern + Stored Procedures).
 * @project Consultora Médica
 */

const db = require('../config/db');

class UserRepository {
    async findByUsername(username) {
        const [rows] = await db.execute('CALL sp_find_user_by_username(?)', [username]);
        return rows[0][0];
    }

    async findById(id) {
        const [rows] = await db.execute('CALL sp_find_user_by_id(?)', [id]);
        return rows[0][0];
    }

    async create(username, hashedPassword, role = 'paciente', edad = null,
        nombre = null, apellido = null, ciudad = null, nacionalidad = null,
        fechaNacimiento = null, email = null) {
        const [rows] = await db.execute('CALL sp_create_user(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, role, edad, nombre, apellido, ciudad, nacionalidad, fechaNacimiento, email]);
        return rows[0][0].insertId;
    }

    async findAll() {
        const [rows] = await db.execute('CALL sp_find_all_users()');
        return rows[0];
    }

    async updateRole(id, roleName) {
        const [rows] = await db.execute('CALL sp_update_user_role(?, ?)', [id, roleName]);
        return rows[0][0].affected;
    }

    async updateProfile(id, nombre, apellido, ciudad, nacionalidad, fechaNacimiento, edad, email) {
        const [rows] = await db.execute('CALL sp_update_user_profile(?, ?, ?, ?, ?, ?, ?, ?)',
            [id, nombre, apellido, ciudad, nacionalidad, fechaNacimiento, edad, email]);
        return rows[0][0].affected;
    }

    async deactivate(id) {
        const [rows] = await db.execute('CALL sp_deactivate_user(?)', [id]);
        return rows[0][0].affected;
    }

    async activate(id) {
        const [rows] = await db.execute('CALL sp_activate_user(?)', [id]);
        return rows[0][0].affected;
    }
}

module.exports = new UserRepository();
