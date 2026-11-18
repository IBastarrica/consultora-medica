/**
 * @file analyst_front_controller.js
 * @brief Controlador frontend del panel del analista de datos.
 * @project Consultora Médica
 */

const analystFrontController = {
    async load() {
        try {
            const [descriptiva, regresion, analisisTurnos, conclusiones] = await Promise.all([
                apiService.request('/analyst/descriptiva'),
                apiService.request('/analyst/regresion'),
                apiService.request('/analyst/turnos/analisis'),
                apiService.request('/analyst/conclusiones')
            ]);

            statsRenderer.renderDescriptiva(descriptiva, regresion);
            statsRenderer.renderRegresion(regresion);
            statsRenderer.renderBoxplot('boxplotMuestra', descriptiva.boxplot, 'Tiempo de atención (min)');
            statsRenderer.renderProbabilidades(descriptiva, 'tablaProbabilidades', regresion);
            statsRenderer.renderTurnosAnalisis(analisisTurnos);
            statsRenderer.renderBoxplot('boxplotReales', analisisTurnos.boxplot, 'Tiempo real (min)');
            statsRenderer.renderOutliersIQR(descriptiva, analisisTurnos, 'tablaOutliersIQR');
            statsRenderer.renderProbabilidadesReales(analisisTurnos, 'tablaProbabilidadesReales');
            statsRenderer.renderConclusiones(conclusiones.conclusiones, 'listaConclusiones');
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
