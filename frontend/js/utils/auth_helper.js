/**
 * @file auth_helper.js
 * @brief Ciclo de vida de la sesión local (token y rol) y guardas de acceso.
 * @project Consultora Médica
 */

const ROLE_HOME = {
    paciente: '/patient',
    medico: '/doctor',
    analista: '/analyst',
    admin: '/admin'
};

const authHelper = {
    storage: localStorage,

    saveSession(token, role) {
        this.storage.setItem('token', token);
        this.storage.setItem('role', role);
    },

    getToken() {
        return this.storage.getItem('token');
    },

    getRole() {
        return this.storage.getItem('role');
    },

    logout() {
        this.storage.clear();
        window.location.href = '/login';
    },

    /**
     * @brief Guarda de acceso a paneles privados.
     * @param {string} [role] - Rol requerido. Si no coincide, redirige a su panel.
     */
    guard(role) {
        if (!this.getToken()) {
            window.location.href = '/login';
            return false;
        }
        if (role && this.getRole() !== role) {
            window.location.href = ROLE_HOME[this.getRole()] || '/login';
            return false;
        }
        return true;
    },

    initLogoutButtons() {
        document.querySelectorAll('.btn-logout').forEach(btn => {
            btn.addEventListener('click', () => this.logout());
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    authHelper.initLogoutButtons();
});
