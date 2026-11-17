/**
 * @file auth_front_controller.js
 * @brief Controlador frontend de login y registro.
 * @project Consultora Médica
 */

const authFrontController = {
    initLogin() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            try {
                const result = await apiService.request('/auth/login', 'POST', { username, password });
                authHelper.saveSession(result.token, result.role);
                window.location.href = ROLE_HOME[result.role] || '/patient';
            } catch (error) {
                UI.showToast(error.message, 'err');
            }
        });
    },

    initRegister() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const nombre = document.getElementById('nombre').value.trim();
            const apellido = document.getElementById('apellido').value.trim();
            const ciudad = document.getElementById('ciudad').value.trim();
            const nacionalidad = document.getElementById('nacionalidad').value.trim();
            const fechaNacimiento = document.getElementById('fecha_nacimiento').value;
            const edad = document.getElementById('edad').value;

            const payload = { username, password, nombre, apellido, ciudad, nacionalidad, fecha_nacimiento: fechaNacimiento };
            if (edad !== '') payload.edad = Number(edad);

            try {
                const result = await apiService.request('/auth/register', 'POST', payload);
                UI.showModal('Registro exitoso',
                    `Tu cuenta de paciente fue creada con el email ${result.email}. Ya podés iniciar sesión.`);
                window.location.href = '/login';
            } catch (error) {
                UI.showToast(error.message, 'err');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    authFrontController.initLogin();
    authFrontController.initRegister();
});
