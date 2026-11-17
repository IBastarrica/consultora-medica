/**
 * @file stats_renderer.js
 * @brief Renderizador compartido de estadísticas (KPIs, tablas y gráficos Chart.js).
 * @project Consultora Médica
 */

const statsRenderer = {
    charts: {},

    destroyChart(id) {
        if (this.charts[id]) {
            this.charts[id].destroy();
            delete this.charts[id];
        }
    },

    /**
     * @brief Dibuja KPIs y tabla descriptiva.
     */
    renderDescriptiva(descData, regData) {
        const kpis = document.getElementById('kpis');
        if (kpis) {
            UI.clear(kpis);
            const items = [
                ['Consultas (n)', descData.n_total],
                ['Media global (min)', Number(descData.general.media).toFixed(2)],
                ['CV global (%)', Number(descData.general.cv).toFixed(2)],
                ['r (edad vs tiempo)', Number(regData.modelo_edad.r).toFixed(4)],
                ['R² (edad vs tiempo)', (Number(regData.modelo_edad.r2) * 100).toFixed(2) + '%'],
                ['ρ Spearman (edad vs tiempo)', Number(regData.spearman_edad).toFixed(4)],
                ['Outliers detectados', regData.outliers.length],
                ['Cooldown sugerido (min)', (regData.cooldown_sugerido || 5) + ' min']
            ];
            items.forEach(([label, value]) => {
                const card = UI.el('div', 'cm-kpi');
                card.appendChild(UI.el('div', 'kpi-label', label));
                card.appendChild(UI.el('div', 'kpi-value', value));
                kpis.appendChild(card);
            });
        }

        const container = document.getElementById('tablaDescriptiva');
        if (container) {
            UI.clear(container);
            const rows = descData.doctores.map(d => [
                d.medico,
                d.especialidad,
                d.anios_experiencia,
                d.n,
                Number(d.media).toFixed(2),
                Number(d.mediana).toFixed(2),
                Number(d.desviacion).toFixed(2),
                Number(d.cv).toFixed(2) + '%',
                Number(d.iqr).toFixed(2),
                UI.badge(d.nivel_riesgo, d.nivel_riesgo),
                d.diagnostico
            ]);
            container.appendChild(UI.buildTable(
                ['Médico', 'Especialidad', 'Exp. (años)', 'n', 'Media (min)', 'Mediana', 'Desvío', 'CV', 'IQR', 'Riesgo', 'Diagnóstico'],
                rows
            ));
        }

        const posContainer = document.getElementById('tablaMedidasPosicion');
        if (posContainer && descData.medidas_posicion && descData.general) {
            UI.clear(posContainer);
            const mp = descData.medidas_posicion;
            const g = descData.general;
            const fila = (campo, valor) => {
                const tr = document.createElement('tr');
                tr.appendChild(UI.el('td', null, campo));
                tr.appendChild(UI.el('td', null, valor));
                return tr;
            };

            const tabla = UI.el('table', 'cm-table');
            const tbody = document.createElement('tbody');
            [
                ['n (tamaño muestral)', mp.n],
                ['Mínimo (min)', Number(mp.min).toFixed(2)],
                ['Primer cuartil Q1 (min)', Number(mp.q1).toFixed(2)],
                ['Mediana Q2 (min)', Number(mp.mediana).toFixed(2)],
                ['Tercer cuartil Q3 (min)', Number(mp.q3).toFixed(2)],
                ['Máximo (min)', Number(mp.max).toFixed(2)],
                ['Rango intercuartílico IQR (min)', Number(mp.iqr).toFixed(2)],
                ['Media (min)', Number(g.media).toFixed(2)],
                ['Varianza muestral', Number(g.varianza).toFixed(2)],
                ['Desvío estándar (min)', Number(g.desviacion).toFixed(2)],
                ['Coeficiente de Variación', Number(g.cv).toFixed(2) + '%'],
                ['Covarianza muestral (edad, tiempo)', Number(regData.covarianza_edad).toFixed(2)],
                ['ρ de Spearman (edad, tiempo)', Number(regData.spearman_edad).toFixed(4)]
            ].forEach(([campo, valor]) => tbody.appendChild(fila(campo, valor)));
            tabla.appendChild(tbody);
            posContainer.appendChild(tabla);
        }
    },

    /**
     * @brief Dibuja los dos gráficos de regresión (scatter + recta + centroide).
     */
    renderRegresion(regData) {
        this.destroyChart('chartEdad');
        this.destroyChart('chartExp');

        const scatterPoints = (xs, ys) => xs.map((x, i) => ({ x, y: ys[i] }));

        const canvasEdad = document.getElementById('chartEdad');
        if (canvasEdad && regData.registros.length >= 3) {
            const m = regData.modelo_edad;
            const edades = regData.registros.map(r => r.edad);
            const tiempos = regData.registros.map(r => r.tiempo);
            const xMin = Math.min(...edades);
            const xMax = Math.max(...edades);

            this.charts.chartEdad = new Chart(canvasEdad, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: `Turnos observados (n=${edades.length})`,
                            data: scatterPoints(edades, tiempos),
                            backgroundColor: '#1F77B4'
                        },
                        {
                            label: `Recta: ŷ = ${m.a.toFixed(2)} + ${m.b.toFixed(2)}x`,
                            data: [{ x: xMin, y: m.a + m.b * xMin }, { x: xMax, y: m.a + m.b * xMax }],
                            type: 'line',
                            borderColor: '#D62728',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false
                        },
                        {
                            label: 'Centro de Medias',
                            data: [{ x: m.mean_x, y: m.mean_y }],
                            backgroundColor: '#2CA02C',
                            pointRadius: 8
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { title: { display: true, text: 'Edad del Paciente (años)' } },
                        y: { title: { display: true, text: 'Tiempo de Atención (min)' } }
                    }
                }
            });
        }

        const canvasExp = document.getElementById('chartExp');
        if (canvasExp && regData.registros.length >= 3) {
            const m = regData.modelo_exp;
            const exps = regData.registros.map(r => r.experiencia);
            const tiempos = regData.registros.map(r => r.tiempo);
            const xMin = Math.min(...exps);
            const xMax = Math.max(...exps);

            this.charts.chartExp = new Chart(canvasExp, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: `Turnos observados (n=${exps.length})`,
                            data: scatterPoints(exps, tiempos),
                            backgroundColor: '#9467BD'
                        },
                        {
                            label: `Recta: ŷ = ${m.a.toFixed(2)} + ${m.b.toFixed(2)}x`,
                            data: [{ x: xMin, y: m.a + m.b * xMin }, { x: xMax, y: m.a + m.b * xMax }],
                            type: 'line',
                            borderColor: '#D62728',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false
                        },
                        {
                            label: 'Centro de Medias',
                            data: [{ x: m.mean_x, y: m.mean_y }],
                            backgroundColor: '#2CA02C',
                            pointRadius: 8
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { title: { display: true, text: 'Años de Experiencia' } },
                        y: { title: { display: true, text: 'Tiempo de Atención (min)' } }
                    }
                }
            });
        }

        const container = document.getElementById('tablaOutliers');
        if (container) {
            UI.clear(container);
            if (regData.outliers.length === 0) {
                container.appendChild(UI.el('p', null, 'No se detectaron casos atípicos.'));
            } else {
                const rows = regData.outliers.map(o => [
                    o.info.medico || '-',
                    o.x,
                    o.y_real,
                    Number(o.y_pred).toFixed(2),
                    Number(o.residuo).toFixed(2),
                    Number(regData.modelo_edad.se).toFixed(2)
                ]);
                container.appendChild(UI.buildTable(
                    ['Médico', 'Edad', 'Tiempo real', 'Tiempo predicho', 'Residuo', 'se'],
                    rows
                ));
            }
        }

        // Inferencia: test de hipótesis, intervalos y ANOVA
        this.renderInferencia('tablaInferencia', regData.inferencia_edad, regData.modelo_edad);
        this.renderAnova('tablaAnova', regData.inferencia_edad);

        // Gráfico de residuos vs valores predichos
        this.destroyChart('chartResiduos');
        const canvasRes = document.getElementById('chartResiduos');
        if (canvasRes && regData.registros.length >= 3) {
            const m = regData.modelo_edad;
            this.charts.chartResiduos = new Chart(canvasRes, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Residuos e = y - ŷ',
                            data: m.y_pred.map((yp, i) => ({ x: yp, y: m.residuos[i] })),
                            backgroundColor: '#1F77B4'
                        },
                        {
                            label: 'Línea de referencia e = 0',
                            data: [{ x: Math.min(...m.y_pred), y: 0 }, { x: Math.max(...m.y_pred), y: 0 }],
                            type: 'line',
                            borderColor: '#D62728',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { title: { display: true, text: 'Valores predichos ŷ (min)' } },
                        y: { title: { display: true, text: 'Residuo e (min)' } }
                    }
                }
            });
        }
    },

    /**
     * @brief Tabla de inferencia: test t de la pendiente, IC 95% y métricas del modelo.
     */
    renderInferencia(containerId, inf, modelo) {
        const container = document.getElementById(containerId);
        if (!container) return;
        UI.clear(container);

        if (!inf || inf.p_valor === null) {
            container.appendChild(UI.el('p', null, 'Datos insuficientes para inferencia (n < 3).'));
            return;
        }

        const fila = (campo, valor) => {
            const tr = document.createElement('tr');
            tr.appendChild(UI.el('td', null, campo));
            tr.appendChild(UI.el('td', null, valor));
            return tr;
        };

        const pTexto = inf.p_valor < 0.0001
            ? '< 0.0001'
            : Number(inf.p_valor).toFixed(4);

        const tabla = UI.el('table', 'cm-table');
        const tbody = document.createElement('tbody');
        [
            ['Coeficiente de correlación r (Pearson)', Number(modelo.r).toFixed(4)],
            ['Coeficiente de determinación R²', Number(modelo.r2).toFixed(4)],
            ['R² ajustado', Number(inf.r2_ajustado).toFixed(4)],
            ['Covarianza muestral', Number(modelo.cov_xy).toFixed(2)],
            ['Error estándar de la estimación se', Number(modelo.se).toFixed(3)],
            ['Error estándar de la pendiente se(b)', Number(inf.se_b).toFixed(4)],
            ['Estadístico t (pendiente)', Number(inf.t).toFixed(3)],
            ['Grados de libertad', inf.gl],
            ['Valor p (bilateral)', pTexto],
            ['Decisión (α = 0.05)', inf.significativo ? 'H0 RECHAZADA: la relación es estadísticamente significativa' : 'H0 NO rechazada: sin evidencia suficiente'],
            ['IC 95% de la pendiente b', `[${Number(inf.ic_pendiente[0]).toFixed(3)} ; ${Number(inf.ic_pendiente[1]).toFixed(3)}]`]
        ].forEach(([campo, valor]) => tbody.appendChild(fila(campo, valor)));
        tabla.appendChild(tbody);
        container.appendChild(tabla);
    },

    /**
     * @brief Tabla ANOVA de la regresión (descomposición de la varianza).
     */
    renderAnova(containerId, inf) {
        const container = document.getElementById(containerId);
        if (!container) return;
        UI.clear(container);

        if (!inf || !inf.anova || inf.anova.sct === null) {
            container.appendChild(UI.el('p', null, 'Datos insuficientes para la tabla ANOVA.'));
            return;
        }

        const a = inf.anova;
        const rows = [
            ['Regresión (explicada)', Number(a.sce).toFixed(2), a.gl_reg, Number(a.cm_reg).toFixed(2), Number(a.F).toFixed(2), a.p < 0.0001 ? '< 0.0001' : Number(a.p).toFixed(4)],
            ['Residuos (no explicada)', Number(a.scr).toFixed(2), a.gl_res, Number(a.cm_res).toFixed(2), '-', '-'],
            ['Total', Number(a.sct).toFixed(2), a.gl_tot, '-', '-', '-']
        ];
        container.appendChild(UI.buildTable(
            ['Fuente de variación', 'Suma de cuadrados', 'gl', 'Cuadrado medio', 'F', 'Valor p'],
            rows
        ));
    },

    /**
     * @brief Renderiza el análisis de turnos reales: KPIs, tabla por doctor,
     *        gráfico de espera/demora y detalle de atendidos.
     */
    renderTurnosAnalisis(data) {
        const kpis = document.getElementById('kpisTurnos');
        if (kpis) {
            UI.clear(kpis);
            const items = [
                ['Turnos totales', data.n_total_turnos],
                ['Atendidos', data.n_atendidos],
                ['Media tiempo real (min)', data.general.media_real],
                ['CV tiempo real (%)', data.general.cv_real],
                ['Media espera (min)', data.general.media_espera !== null ? data.general.media_espera : '-'],
                ['Media demora (min)', data.general.media_demora !== null ? data.general.media_demora : '-'],
                ['r calibración (est vs real)', Number(data.regresion_calibracion.r).toFixed(4)],
                ['ρ Spearman (edad vs real)', Number(data.spearman_real).toFixed(4)]
            ];
            items.forEach(([label, value]) => {
                const card = UI.el('div', 'cm-kpi');
                card.appendChild(UI.el('div', 'kpi-label', label));
                card.appendChild(UI.el('div', 'kpi-value', value));
                kpis.appendChild(card);
            });
        }

        const container = document.getElementById('tablaAnalisisTurnos');
        if (container) {
            UI.clear(container);
            const rows = data.doctores.map(d => [
                d.medico,
                d.especialidad,
                d.n_atendidos,
                d.media_real,
                d.desviacion_real,
                d.cv_real + '%',
                UI.badge(d.nivel_riesgo, d.nivel_riesgo),
                d.media_demora !== null ? d.media_demora : '-',
                d.media_espera !== null ? d.media_espera : '-',
                d.n_esperas
            ]);
            container.appendChild(UI.buildTable(
                ['Médico', 'Especialidad', 'n atendidos', 'Media real (min)', 'Desvío real', 'CV real', 'Riesgo', 'Demora media', 'Espera media', 'n esperas'],
                rows
            ));
        }

        this.destroyChart('chartEspera');
        const canvas = document.getElementById('chartEspera');
        if (canvas && data.doctores.length > 0) {
            this.charts.chartEspera = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: data.doctores.map(d => d.medico),
                    datasets: [
                        {
                            label: 'Espera media (min)',
                            data: data.doctores.map(d => d.media_espera),
                            backgroundColor: '#1F77B4'
                        },
                        {
                            label: 'Demora media (min)',
                            data: data.doctores.map(d => d.media_demora),
                            backgroundColor: '#D62728'
                        }
                    ]
                },
                options: {
                    scales: {
                        y: { title: { display: true, text: 'Minutos' } }
                    }
                }
            });
        }

        const detalle = document.getElementById('tablaRegistrosTurnos');
        if (detalle) {
            UI.clear(detalle);
            if (data.registros.length === 0) {
                detalle.appendChild(UI.el('p', null, 'Aún no hay turnos atendidos con tiempo real cargado.'));
            } else {
                const rows = data.registros.map(r => [
                    r.fecha,
                    r.hora,
                    r.paciente,
                    r.edad !== null ? r.edad : '-',
                    r.medico,
                    Number(r.estimado).toFixed(2),
                    r.real,
                    r.demora,
                    r.espera !== null ? r.espera : '-'
                ]);
                detalle.appendChild(UI.buildTable(
                    ['Fecha', 'Hora', 'Paciente', 'Edad', 'Médico', 'Estimado', 'Real', 'Demora', 'Espera'],
                    rows
                ));
            }
        }

        // Inferencia del modelo real y residuos reales
        this.renderInferencia('tablaInferenciaReal', data.inferencia_real, data.regresion_edad_real.modelo);

        this.destroyChart('chartResiduosReales');
        const canvasResReal = document.getElementById('chartResiduosReales');
        if (canvasResReal && data.registros.length >= 3) {
            const m = data.regresion_edad_real.modelo;
            this.charts.chartResiduosReales = new Chart(canvasResReal, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Residuos reales e = y - ŷ',
                            data: m.y_pred.map((yp, i) => ({ x: yp, y: m.residuos[i] })),
                            backgroundColor: '#1F77B4'
                        },
                        {
                            label: 'Línea de referencia e = 0',
                            data: [{ x: Math.min(...m.y_pred), y: 0 }, { x: Math.max(...m.y_pred), y: 0 }],
                            type: 'line',
                            borderColor: '#D62728',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { title: { display: true, text: 'Valores predichos ŷ (min)' } },
                        y: { title: { display: true, text: 'Residuo e (min)' } }
                    }
                }
            });
        }
    }
};
