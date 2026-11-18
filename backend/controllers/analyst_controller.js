/**
 * @file analyst_controller.js
 * @brief Controlador del rol Analista de Datos: descriptiva, regresión, correlación y outliers.
 * @project Consultora Médica
 */

const statsRepository = require('../repositories/stats_repository');
const turnoRepository = require('../repositories/turno_repository');
const stats = require('../utils/stats/stats_engine');
const prob = require('../utils/stats/probabilidades');
const { generarConclusiones } = require('../utils/stats/conclusiones');
const { generarReporteExcel } = require('../utils/excel/excel_export');

class AnalystController {
    /**
     * @brief Análisis descriptivo univariado por doctor (media, varianza, desvío, CV).
     */
    async _obtenerDescriptiva() {
        const consultas = await statsRepository.findConsultas();

            const porDoctor = new Map();
            consultas.forEach(c => {
                if (!porDoctor.has(c.id_doctor)) {
                    porDoctor.set(c.id_doctor, {
                        id_doctor: c.id_doctor,
                        medico: c.medico,
                        especialidad: c.especialidad,
                        anios_experiencia: c.anios_experiencia_doc,
                        tiempos: []
                    });
                }
                porDoctor.get(c.id_doctor).tiempos.push(c.tiempo_atencion_min);
            });

            const doctores = [];
            const todosLosTiempos = [];

            porDoctor.forEach(d => {
                todosLosTiempos.push(...d.tiempos);
                const st = stats.estadisticasUnivariadas(d.tiempos);
                if (st) {
                    const { diagnostico, nivelRiesgo } = stats.clasificarHomogeneidad(st.cv);
                    const pos = stats.cuartiles(d.tiempos);
                    doctores.push({
                        id_doctor: d.id_doctor,
                        medico: d.medico,
                        especialidad: d.especialidad,
                        anios_experiencia: d.anios_experiencia,
                        n: st.n,
                        media: st.media,
                        varianza: st.varianza,
                        desviacion: st.desviacion,
                        cv: st.cv,
                        mediana: pos ? pos.mediana : null,
                        iqr: pos ? pos.iqr : null,
                        diagnostico,
                        nivel_riesgo: nivelRiesgo
                    });
                } else {
                    doctores.push({
                        id_doctor: d.id_doctor,
                        medico: d.medico,
                        especialidad: d.especialidad,
                        anios_experiencia: d.anios_experiencia,
                        n: d.tiempos.length,
                        media: 0, varianza: 0, desviacion: 0, cv: 0,
                        mediana: null, iqr: null,
                        diagnostico: 'Sin datos suficientes (n < 2)',
                        nivel_riesgo: 'N/D'
                    });
                }
            });

            const general = stats.estadisticasUnivariadas(todosLosTiempos);
            const interpGeneral = general ? stats.clasificarHomogeneidad(general.cv) : null;
            const posicionGlobal = stats.cuartiles(todosLosTiempos);

            const ordenados = doctores.filter(d => d.n >= 2).sort((a, b) => a.cv - b.cv);

            // Datos para box-plot y outliers de Tukey (muestra)
            const boxplot = [{ label: 'Global (n=100)', valores: [...todosLosTiempos] }]
                .concat(doctores.filter(d => d.n >= 2).map(d => ({
                    label: d.medico,
                    valores: porDoctor.get(d.id_doctor).tiempos
                })));
            const outliersIqrGlobal = stats.outliersIQR(todosLosTiempos);
            const outliersIqrDoctores = doctores.filter(d => d.n >= 2).map(d => ({
                id_doctor: d.id_doctor,
                medico: d.medico,
                ...stats.outliersIQR(porDoctor.get(d.id_doctor).tiempos)
            }));

            return {
                n_total: todosLosTiempos.length,
                general: general || { n: todosLosTiempos.length, media: 0, varianza: 0, desviacion: 0, cv: 0 },
                diagnostico_general: interpGeneral ? interpGeneral.diagnostico : 'N/D',
                nivel_riesgo_general: interpGeneral ? interpGeneral.nivelRiesgo : 'N/D',
                medidas_posicion: posicionGlobal,
                doctores,
                doc_mas_homogeneo: ordenados[0] || null,
                doc_mas_disperso: ordenados[ordenados.length - 1] || null,
                boxplot,
                outliers_iqr_global: outliersIqrGlobal,
                outliers_iqr_doctores: outliersIqrDoctores
            };
    }

    /**
     * @brief Handler HTTP del análisis descriptivo.
     */
    getDescriptiva = async (req, res, next) => {
        try {
            res.json(await this._obtenerDescriptiva());
        } catch (error) {
            next(error);
        }
    };

    /**
     * @brief Regresión lineal y correlación: edad vs tiempo y experiencia vs tiempo.
     */
    async _obtenerRegresion() {
        const consultas = await statsRepository.findConsultas();

            const registros = consultas.map(c => ({
                id: c.id_consulta,
                edad: c.edad_paciente,
                experiencia: c.anios_experiencia_doc,
                tiempo: c.tiempo_atencion_min,
                medico: c.medico,
                especialidad: c.especialidad
            }));

            const edades = registros.map(r => r.edad);
            const experiencias = registros.map(r => r.experiencia);
            const tiempos = registros.map(r => r.tiempo);

            const modeloEdad = stats.modeloBivariado(edades, tiempos, registros);
            const modeloExp = stats.modeloBivariado(experiencias, tiempos, registros);

            const interpEdad = stats.interpretarCorrelacion(modeloEdad.r);
            const interpExp = stats.interpretarCorrelacion(modeloExp.r);

            // Probabilidades (Unidad 2): modelo normal de los tiempos de la muestra
            const stTiempos = stats.estadisticasUnivariadas(tiempos);
            const probabilidades = {
                media: Math.round(stTiempos.media * 100) / 100,
                desvio: Math.round(stTiempos.desviacion * 100) / 100,
                p_mayor_30: prob.probabilidadMayorQue(30, stTiempos.media, stTiempos.desviacion),
                p_mayor_40: prob.probabilidadMayorQue(40, stTiempos.media, stTiempos.desviacion),
                p_entre_25_35: prob.probabilidadEntre(25, 35, stTiempos.media, stTiempos.desviacion),
                percentil_90: stTiempos.media + prob.cuantilNormal(0.90) * stTiempos.desviacion
            };

            return {
                n: registros.length,
                registros,
                modelo_edad: modeloEdad,
                modelo_exp: modeloExp,
                fuerza_edad: interpEdad.fuerza,
                sentido_edad: interpEdad.sentido,
                fuerza_exp: interpExp.fuerza,
                sentido_exp: interpExp.sentido,
                outliers: modeloEdad.outliers,
                cooldown_sugerido: Math.max(5, Math.round(modeloEdad.se)),
                covarianza_edad: modeloEdad.cov_xy,
                spearman_edad: stats.spearman(edades, tiempos),
                inferencia_edad: stats.inferenciaModelo(modeloEdad),
                inferencia_exp: stats.inferenciaModelo(modeloExp),
                probabilidades
            };
    }

    /**
     * @brief Handler HTTP de la regresión.
     */
    getRegresion = async (req, res, next) => {
        try {
            res.json(await this._obtenerRegresion());
        } catch (error) {
            next(error);
        }
    };

    /**
     * @brief Análisis estadístico de los turnos REALES:
     *        tiempo de espera entre turnos, demora (real vs estimado),
     *        CV por doctor, regresión edad vs tiempo real y calibración del modelo.
     */
    async _obtenerAnalisisTurnos() {
        const turnos = await turnoRepository.findAllAnalisis();
            const atendidos = turnos.filter(t => t.estado === 'Atendido' && t.tiempo_atencion_real_min !== null);

            const horaAMinutos = (h) => {
                const m = /^(\d{1,2}):(\d{2})/.exec(String(h || ''));
                return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
            };

            // Agrupar por doctor + día para calcular espera entre turnos consecutivos
            const grupos = new Map();
            atendidos.forEach(t => {
                const clave = `${t.id_doctor}|${t.fecha_raw}`;
                if (!grupos.has(clave)) grupos.set(clave, []);
                grupos.get(clave).push(t);
            });

            const esperaPorTurno = new Map();
            grupos.forEach(lista => {
                lista.sort((a, b) => horaAMinutos(a.hora_turno) - horaAMinutos(b.hora_turno));
                for (let i = 1; i < lista.length; i++) {
                    const prev = lista[i - 1];
                    const curr = lista[i];
                    const finPrev = horaAMinutos(prev.hora_turno) + (prev.tiempo_atencion_real_min || 0);
                    const espera = horaAMinutos(curr.hora_turno) - finPrev;
                    esperaPorTurno.set(curr.id_turno, Math.round(espera * 10) / 10);
                }
            });

            const registros = atendidos.map(t => {
                const demora = Math.round((t.tiempo_atencion_real_min - t.tiempo_estimado_min) * 10) / 10;
                return {
                    id_turno: t.id_turno,
                    fecha: t.fecha_turno,
                    hora: t.hora_turno,
                    id_doctor: t.id_doctor,
                    paciente: [t.nombre, t.apellido].filter(Boolean).join(' ') || t.paciente,
                    edad: t.edad,
                    medico: t.medico,
                    especialidad: t.especialidad,
                    estimado: t.tiempo_estimado_min,
                    real: t.tiempo_atencion_real_min,
                    demora,
                    espera: esperaPorTurno.has(t.id_turno) ? esperaPorTurno.get(t.id_turno) : null
                };
            });

            // Agregados por doctor
            const porDoctor = new Map();
            registros.forEach(r => {
                if (!porDoctor.has(r.id_doctor)) {
                    porDoctor.set(r.id_doctor, {
                        medico: r.medico,
                        especialidad: r.especialidad,
                        reales: [], demoras: [], esperas: []
                    });
                }
                const d = porDoctor.get(r.id_doctor);
                d.reales.push(r.real);
                d.demoras.push(r.demora);
                if (r.espera !== null) d.esperas.push(r.espera);
            });

            const doctoresResumen = [];
            porDoctor.forEach((d, idDoctor) => {
                const stReal = stats.estadisticasUnivariadas(d.reales);
                const stDemora = stats.estadisticasUnivariadas(d.demoras);
                const stEspera = stats.estadisticasUnivariadas(d.esperas);
                const diag = stReal ? stats.clasificarHomogeneidad(stReal.cv) : { diagnostico: 'N/D', nivelRiesgo: 'N/D' };

                doctoresResumen.push({
                    id_doctor: Number(idDoctor),
                    medico: d.medico,
                    especialidad: d.especialidad,
                    n_atendidos: d.reales.length,
                    media_real: stReal ? Math.round(stReal.media * 10) / 10 : 0,
                    desviacion_real: stReal ? Math.round(stReal.desviacion * 10) / 10 : 0,
                    cv_real: stReal ? Math.round(stReal.cv * 10) / 10 : 0,
                    diagnostico: diag.diagnostico,
                    nivel_riesgo: diag.nivelRiesgo,
                    media_demora: stDemora ? Math.round(stDemora.media * 10) / 10 : null,
                    desviacion_demora: stDemora ? Math.round(stDemora.desviacion * 10) / 10 : null,
                    media_espera: stEspera ? Math.round(stEspera.media * 10) / 10 : null,
                    n_esperas: d.esperas.length
                });
            });
            doctoresResumen.sort((a, b) => a.id_doctor - b.id_doctor);

            // Generales
            const todosReales = registros.map(r => r.real);
            const todosDemoras = registros.map(r => r.demora);
            const todasEsperas = registros.map(r => r.espera).filter(e => e !== null);

            const generalReal = stats.estadisticasUnivariadas(todosReales);
            const generalDemora = stats.estadisticasUnivariadas(todosDemoras);
            const generalEspera = stats.estadisticasUnivariadas(todasEsperas);

            // Regresión: edad vs tiempo real (misma hipótesis del TP, ahora con datos reales)
            const edades = registros.map(r => r.edad);
            const reals = registros.map(r => r.real);
            const modeloEdadReal = stats.modeloBivariado(edades, reals, registros);
            const interpEdad = stats.interpretarCorrelacion(modeloEdadReal.r);

            // Calibración del modelo: correlación entre estimado y real
            const estimados = registros.map(r => r.estimado);
            const modeloCalibracion = stats.modeloBivariado(estimados, reals, registros);
            const interpCalibracion = stats.interpretarCorrelacion(modeloCalibracion.r);

            // Box-plot y outliers de Tukey sobre tiempos reales
            const boxplot = [{ label: 'Global', valores: [...todosReales] }]
                .concat(doctoresResumen.map(d => ({
                    label: d.medico,
                    valores: porDoctor.get(d.id_doctor).reales
                })));
            const outliersIqrGlobal = stats.outliersIQR(todosReales);
            const outliersIqrDoctores = doctoresResumen.map(d => ({
                id_doctor: d.id_doctor,
                medico: d.medico,
                ...stats.outliersIQR(porDoctor.get(d.id_doctor).reales)
            }));

            // Probabilidades (Unidad 2) sobre la operación real
            const stEsperas = stats.estadisticasUnivariadas(todasEsperas);
            const pDemoraPositiva = todosDemoras.filter(v => v > 0).length / todosDemoras.length;
            const probabilidades = {
                reales: {
                    media: generalReal.media,
                    desvio: generalReal.desviacion,
                    p_mayor_35: prob.probabilidadMayorQue(35, generalReal.media, generalReal.desviacion),
                    p_mayor_40: prob.probabilidadMayorQue(40, generalReal.media, generalReal.desviacion)
                },
                demoras: {
                    media: generalDemora ? generalDemora.media : null,
                    desvio: generalDemora ? generalDemora.desviacion : null,
                    p_mayor_10: generalDemora ? prob.probabilidadMayorQue(10, generalDemora.media, generalDemora.desviacion) : null,
                    p_demora_positiva: pDemoraPositiva
                },
                esperas: {
                    media: stEsperas ? stEsperas.media : null,
                    desvio: stEsperas ? stEsperas.desviacion : null,
                    p_mayor_20: stEsperas ? prob.probabilidadMayorQue(20, stEsperas.media, stEsperas.desviacion) : null
                },
                binomial: {
                    p: pDemoraPositiva,
                    n: 10,
                    tabla: prob.tablaBinomial(pDemoraPositiva, 10)
                }
            };

            return {
                n_total_turnos: turnos.length,
                n_atendidos: atendidos.length,
                general: {
                    media_real: generalReal ? Math.round(generalReal.media * 10) / 10 : 0,
                    desviacion_real: generalReal ? Math.round(generalReal.desviacion * 10) / 10 : 0,
                    cv_real: generalReal ? Math.round(generalReal.cv * 10) / 10 : 0,
                    media_demora: generalDemora ? Math.round(generalDemora.media * 10) / 10 : null,
                    media_espera: generalEspera ? Math.round(generalEspera.media * 10) / 10 : null
                },
                medidas_posicion_real: stats.cuartiles(todosReales),
                doctores: doctoresResumen,
                registros,
                regresion_edad_real: {
                    modelo: modeloEdadReal,
                    fuerza: interpEdad.fuerza,
                    sentido: interpEdad.sentido
                },
                regresion_calibracion: {
                    modelo: modeloCalibracion,
                    fuerza: interpCalibracion.fuerza,
                    sentido: interpCalibracion.sentido,
                    r: modeloCalibracion.r,
                    r2: modeloCalibracion.r2
                },
                spearman_real: stats.spearman(edades, reals),
                spearman_calibracion: stats.spearman(estimados, reals),
                inferencia_real: stats.inferenciaModelo(modeloEdadReal),
                inferencia_calibracion: stats.inferenciaModelo(modeloCalibracion),
                boxplot,
                outliers_iqr_global: outliersIqrGlobal,
                outliers_iqr_doctores: outliersIqrDoctores,
                probabilidades
            };
    }

    /**
     * @brief Handler HTTP del análisis de turnos reales.
     */
    getAnalisisTurnos = async (req, res, next) => {
        try {
            res.json(await this._obtenerAnalisisTurnos());
        } catch (error) {
            next(error);
        }
    };

    /**
     * @brief Exporta el reporte completo a Excel (.xlsx) con múltiples hojas.
     */
    exportarExcel = async (req, res, next) => {
        try {
            const [descriptiva, regresion, turnos] = await Promise.all([
                this._obtenerDescriptiva(),
                this._obtenerRegresion(),
                this._obtenerAnalisisTurnos()
            ]);

            const buffer = await generarReporteExcel({
                descriptiva,
                regresion,
                turnos,
                conclusiones: generarConclusiones(descriptiva, regresion, turnos)
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="reporte_consultora_medica.xlsx"');
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Conclusiones e interpretación socio-técnica generadas a partir de los tres análisis.
     */
    getConclusiones = async (req, res, next) => {
        try {
            const [descriptiva, regresion, turnos] = await Promise.all([
                this._obtenerDescriptiva(),
                this._obtenerRegresion(),
                this._obtenerAnalisisTurnos()
            ]);

            res.json({
                conclusiones: generarConclusiones(descriptiva, regresion, turnos)
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @brief Regresión individual de un doctor sobre sus consultas.
     */
    async getRegresionDoctor(req, res, next) {
        try {
            const { id } = req.params;
            const consultas = await statsRepository.findConsultasByDoctor(id);

            if (consultas.length === 0) {
                return res.status(404).json({ message: 'No hay consultas registradas para este doctor.' });
            }

            const registros = consultas.map(c => ({
                id: c.id_consulta,
                edad: c.edad_paciente,
                experiencia: c.anios_experiencia_doc,
                tiempo: c.tiempo_atencion_min,
                medico: c.medico,
                especialidad: c.especialidad
            }));

            const edades = registros.map(r => r.edad);
            const tiempos = registros.map(r => r.tiempo);

            const modeloEdad = stats.modeloBivariado(edades, tiempos, registros);
            const interp = stats.interpretarCorrelacion(modeloEdad.r);

            res.json({
                id_doctor: Number(id),
                medico: registros[0] ? registros[0].medico : null,
                especialidad: registros[0] ? registros[0].especialidad : null,
                n: registros.length,
                registros,
                modelo_edad: modeloEdad,
                fuerza: interp.fuerza,
                sentido: interp.sentido,
                outliers: modeloEdad.outliers
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AnalystController();
