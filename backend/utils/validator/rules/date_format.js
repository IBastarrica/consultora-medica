/**
 * @file date_format.js
 * @brief Regla de validación: fecha con formato YYYY-MM-DD real y válida.
 * @project Consultora Médica
 */

class DateFormat {
    constructor(messageName = 'CT_DATE_FORMAT') {
        this._messageName = messageName;
        this.validator = null;
    }

    evaluate(target) {
        if (typeof target !== 'string') return false;
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(target.trim());
        if (!match) return false;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    }

    validate(target) {
        if (!this.evaluate(target)) {
            const message = this.validator.i18n.getMessage(this._messageName);
            throw new Error(message);
        }
    }
}

module.exports = DateFormat;
