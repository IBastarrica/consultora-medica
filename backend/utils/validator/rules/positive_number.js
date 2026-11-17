/**
 * @file positive_number.js
 * @brief Regla de validación: valor numérico estrictamente positivo (> 0).
 * @project Consultora Médica
 */

class PositiveNumber {
    constructor(messageName = 'CT_POSITIVE_NUMBER') {
        this._messageName = messageName;
        this.validator = null;
    }

    evaluate(target) {
        const num = Number(target);
        return !isNaN(num) && num > 0;
    }

    validate(target) {
        if (!this.evaluate(target)) {
            const message = this.validator.i18n.getMessage(this._messageName);
            throw new Error(message);
        }
    }
}

module.exports = PositiveNumber;
