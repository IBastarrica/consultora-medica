/**
 * @file in_list.js
 * @brief Regla de validación: el valor debe pertenecer a una lista cerrada.
 * @project Consultora Médica
 */

class InList {
    constructor(allowedList, messageName = 'CT_IN_LIST') {
        this._allowedList = allowedList;
        this._messageName = messageName;
        this.validator = null;
    }

    evaluate(target) {
        return this._allowedList.includes(target);
    }

    validate(target) {
        if (!this.evaluate(target)) {
            const message = this.validator.i18n.getMessage(this._messageName);
            throw new Error(message);
        }
    }
}

module.exports = InList;
