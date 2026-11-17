/**
 * @file required.js
 * @brief Regla de validación: presencia obligatoria de un dato.
 * @project Consultora Médica
 */

class Required {
    constructor(messageName = 'CT_REQUIRED_FIELD') {
        this._messageName = messageName;
        this.validator = null;
    }

    evaluate(target) {
        if (target === null || target === undefined) return false;
        if (typeof target === 'string') return target.trim().length > 0;
        return true;
    }

    validate(target) {
        if (!this.evaluate(target)) {
            const message = this.validator.i18n.getMessage(this._messageName);
            throw new Error(message);
        }
    }
}

module.exports = Required;
