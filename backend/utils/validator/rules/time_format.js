/**
 * @file time_format.js
 * @brief Regla de validación: hora con formato HH:MM o HH:MM:SS.
 * @project Consultora Médica
 */

class TimeFormat {
    constructor(messageName = 'CT_TIME_FORMAT') {
        this._messageName = messageName;
        this.validator = null;
    }

    evaluate(target) {
        if (typeof target !== 'string') return false;
        return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(target.trim());
    }

    validate(target) {
        if (!this.evaluate(target)) {
            const message = this.validator.i18n.getMessage(this._messageName);
            throw new Error(message);
        }
    }
}

module.exports = TimeFormat;
