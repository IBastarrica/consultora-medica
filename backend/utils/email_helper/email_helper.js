/**
 * @file email_helper.js
 * @brief Generador del email institucional: inicial del nombre + apellido @clinica.com.
 * @project Consultora Médica
 */

/**
 * @brief Genera el email institucional del paciente.
 * @param {string} nombre - Nombre del paciente.
 * @param {string} apellido - Apellido del paciente.
 * @returns {string} Email institucional (ej: 'Ivan Bastarrica' -> 'ibastarrica@clinica.com').
 */
function generarEmailInstitucional(nombre, apellido) {
    const limpiar = (s) => String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '');

    return `${limpiar(nombre).charAt(0)}${limpiar(apellido)}@clinica.com`;
}

module.exports = { generarEmailInstitucional };
