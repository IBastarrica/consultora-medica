/**
 * @file ui_handlers.js
 * @brief Constructores de UI seguros (Zero innerHTML): tablas, modales y toasts.
 * @project Consultora Médica
 */

const UI = {
    /**
     * @brief Crea un elemento del DOM sin innerHTML.
     */
    el(tag, className, text) {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined && text !== null) e.textContent = String(text);
        return e;
    },

    clear(node) {
        node.replaceChildren();
        return node;
    },

    /**
     * @brief Toast temporal de feedback.
     */
    showToast(message, type = 'ok') {
        const toast = this.el('div', `cm-toast ${type}`, message);
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    },

    /**
     * @brief Modal informativo genérico (Zero innerHTML).
     */
    showModal(title, message) {
        const bg = this.el('div', 'cm-modal-bg');
        const modal = this.el('div', 'cm-modal');

        modal.appendChild(this.el('h3', null, title));
        modal.appendChild(this.el('p', null, message));

        const actions = this.el('div', 'cm-modal-actions');
        const btnOk = this.el('button', 'cm-tab active', 'Aceptar');
        btnOk.addEventListener('click', () => bg.remove());
        actions.appendChild(btnOk);
        modal.appendChild(actions);

        bg.appendChild(modal);
        document.body.appendChild(bg);
    },

    /**
     * @brief Modal de formulario genérico: campos + botones Guardar/Cancelar.
     * @param {string} title - Título del modal.
     * @param {Array<{id:string,label:string,value?:*,type?:string,options?:Array<{value,text}>}>} fields
     * @param {Function} onSave - Recibe un objeto {idCampo: valor}.
     */
    showFormModal(title, fields, onSave) {
        const bg = this.el('div', 'cm-modal-bg');
        const modal = this.el('div', 'cm-modal');

        modal.appendChild(this.el('h3', null, title));

        const form = this.el('div', 'cm-form');
        const inputs = {};

        fields.forEach(f => {
            const label = this.el('label', null, f.label);
            label.setAttribute('for', `field-${f.id}`);
            form.appendChild(label);

            let input;
            if (f.type === 'select') {
                input = document.createElement('select');
                f.options.forEach(opt => {
                    const option = this.el('option', null, opt.text);
                    option.value = opt.value;
                    if (String(opt.value) === String(f.value)) option.selected = true;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = f.type || 'text';
                if (f.value !== undefined && f.value !== null) input.value = f.value;
            }
            input.id = `field-${f.id}`;
            form.appendChild(input);
            inputs[f.id] = input;
        });

        modal.appendChild(form);

        const actions = this.el('div', 'cm-modal-actions');
        const btnCancel = this.el('button', 'cm-tab', 'Cancelar');
        const btnSave = this.el('button', 'cm-tab active', 'Guardar');
        btnCancel.addEventListener('click', () => bg.remove());
        btnSave.addEventListener('click', () => {
            const values = {};
            Object.keys(inputs).forEach(k => { values[k] = inputs[k].value; });
            onSave(values, bg);
        });
        actions.appendChild(btnCancel);
        actions.appendChild(btnSave);
        modal.appendChild(actions);

        bg.appendChild(modal);
        document.body.appendChild(bg);
    },

    /**
     * @brief Construye una tabla segura. headers: string[], rows: Array<Array<string|Node>>.
     * @returns {HTMLTableElement}
     */
    buildTable(headers, rows) {
        const table = this.el('table', 'cm-table');

        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        headers.forEach(h => trHead.appendChild(this.el('th', null, h)));
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = this.el('td');
                if (cell instanceof Node) {
                    td.appendChild(cell);
                } else {
                    td.textContent = cell === null || cell === undefined ? '' : String(cell);
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        return table;
    },

    /**
     * @brief Botón compacto para filas de tabla.
     */
    actionButton(text, className, onClick) {
        const btn = this.el('button', `cm-tab ${className || ''}`, text);
        btn.style.padding = '4px 12px';
        btn.style.fontSize = '0.8rem';
        btn.addEventListener('click', onClick);
        return btn;
    },

    /**
     * @brief Descarga un archivo autenticado (token JWT) del backend y lo guarda en disco.
     */
    async downloadFile(url, filename) {
        try {
            const token = authHelper.getToken();
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: 'Error al descargar el archivo' }));
                UI.showToast(err.message, 'err');
                return;
            }

            const blob = await response.blob();
            const objUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objUrl);
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    /**
     * @brief Badge de estado/riesgo con clase según valor.
     */
    badge(text, kind) {
        const b = this.el('span', `cm-badge ${String(kind || 'activo').toLowerCase()}`, text);
        return b;
    }
};
