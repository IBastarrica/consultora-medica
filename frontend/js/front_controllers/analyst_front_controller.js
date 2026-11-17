/**
 * @file analyst_front_controller.js
 * @brief Controlador frontend del panel del analista de datos.
 * @project Consultora Médica
 */

const analystFrontController = {
    async load() {
        try {
            const [descriptiva, regresion, analisisTurnos] = await Promise.all([
                apiService.request('/analyst/descriptiva'),
                apiService.request('/analyst/regresion'),
                apiService.request('/analyst/turnos/analisis')
            ]);

            statsRenderer.renderDescriptiva(descriptiva, regresion);
            statsRenderer.renderRegresion(regresion);
            statsRenderer.renderTurnosAnalisis(analisisTurnos);
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    init() {
        if (!authHelper.guard('analista')) return;
        this.load();

        const btnExportar = document.getElementById('btnExportar');
        if (btnExportar) {
            btnExportar.addEventListener('click', () =>
                UI.downloadFile('/api/analyst/exportar', 'reporte_consultora_medica.xlsx'));
        }
    }
};

document.addEventListener('DOMContentLoaded', () => analystFrontController.init());
