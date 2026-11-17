/**
 * @file i18n.js
 * @brief Gestor Singleton de internacionalización (diccionarios en memoria).
 * @project Consultora Médica
 */

const path = require('path');
const fs = require('fs');

class I18n {
    constructor() {
        if (I18n._instance) {
            return I18n._instance;
        }

        this._language = 'es';
        this._resources = {};
        this._localesPath = path.join(__dirname, 'locales');

        this._loadLocales();

        I18n._instance = this;
    }

    _loadLocales() {
        try {
            const files = fs.readdirSync(this._localesPath);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const langCode = path.basename(file, '.json');
                    const filePath = path.join(this._localesPath, file);
                    const rawData = fs.readFileSync(filePath, 'utf-8');
                    this._resources[langCode] = JSON.parse(rawData);
                }
            });
        } catch (error) {
            console.error(`Error al cargar recursos de idioma: ${error.message}`);
        }
    }

    set language(lang) {
        if (this._resources[lang]) {
            this._language = lang;
        } else {
            console.warn(`Idioma '${lang}' no soportado. Se mantiene '${this._language}'.`);
        }
    }

    get language() {
        return this._language;
    }

    getMessage(messageName) {
        try {
            const langDict = this._resources[this._language] || this._resources['es'];
            const message = langDict[messageName];

            if (!message) {
                throw new Error(`La clave '${messageName}' no existe en '${this._language}.json'`);
            }
            return message;
        } catch (e) {
            const fallbackDict = this._resources['es'] || {};
            const fallbackMessage = fallbackDict['CT_INVALID_RESOURCE_CONSTANT'] || 'Clave de recurso no encontrada';
            throw new Error(`${fallbackMessage}. Detalles: ${e.message}`);
        }
    }
}

const instance = new I18n();
Object.freeze(instance);

module.exports = instance;
