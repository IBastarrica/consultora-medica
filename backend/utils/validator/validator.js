/**
 * @file validator.js
 * @brief Motor de validación con Fluent Interface, Strategy y Visitor.
 * @project Consultora Médica
 */

const i18n = require('../i18n/i18n');

class Validator {
    constructor() {
        this.i18n = i18n;
        this._target = null;
    }

    isValid(target, ruleObject) {
        return ruleObject.evaluate(target);
    }

    validateThis(target) {
        this._target = target;
        return this;
    }

    with(ruleObject) {
        ruleObject.validator = this;
        ruleObject.validate(this._target);
        return this;
    }
}

module.exports = Validator;
