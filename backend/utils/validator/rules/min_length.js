/**
 * @file min_length.js
 * @brief Regla de validación: longitud mínima de caracteres.
 * @project Consultora Médica
 */

class MinLength {
    constructor(minLength, messageName = 'CT_MIN_LENGTH') {
        this._minLength = minLength;
        this._messageName = messageName;
        this.validator = null;
    }

    evaluate(target) {
        if (typeof target !== 'string') return false;
        return target.trim().length >= this._minLength;
    }

    validate(target) {
        if (!this.evaluate(target)) {
            const message = this.validator.i18n.getMessage(this._messageName);
            throw new Error(message);
        }
    }
}

module.exports = MinLength;
