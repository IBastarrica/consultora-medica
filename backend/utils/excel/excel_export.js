/**
 * @file excel_export.js
 * @brief Generador del reporte gerencial en Excel (.xlsx) con múltiples hojas.
 * @project Consultora Médica
 */

const ExcelJS = require('exceljs');

const redondear = (v, dec = 2) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(Number(v).toFixed(dec)));

/**
 * @brief Construye el workbook con todas las hojas del análisis.
 * @param {Object} datos - { descriptiva, regresion, turnos }
 * @returns {Promise<Buffer>} Buffer binario del .xlsx.
 */
async function generarReporteExcel({ descriptiva, regresion, turnos }) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Consultora Médica';
    wb.created = new Date();

    // ---------- Hoja 1: PARTE 1 · Muestra histórica - Descriptiva (CV por doctor) ----------
    const wsDesc = wb.addWorksheet('1a-Muestra-Descriptiva');
    wsDesc.columns = [
        { header: 'Médico', key: 'medico', width: 24 },
        { header: 'Especialidad', key: 'especialidad', width: 18 },
        { header: 'Experiencia (años)', key: 'exp', width: 16 },
        { header: 'n', key: 'n', width: 6 },
        { header: 'Media (min)', key: 'media', width: 12 },
        { header: 'Mediana (min)', key: 'mediana', width: 12 },
        { header: 'Desvío (min)', key: 'desvio', width: 12 },
        { header: 'CV (%)', key: 'cv', width: 8 },
        { header: 'IQR (min)', key: 'iqr', width: 10 },
        { header: 'Riesgo', key: 'riesgo', width: 8 },
        { header: 'Diagnóstico', key: 'diagnostico', width: 55 }
    ];
    descriptiva.doctores.forEach(d => wsDesc.addRow({
        medico: d.medico,
        especialidad: d.especialidad,
        exp: d.anios_experiencia,
        n: d.n,
        media: redondear(d.media),
        mediana: redondear(d.mediana),
        desvio: redondear(d.desviacion),
        cv: redondear(d.cv),
        iqr: redondear(d.iqr),
        riesgo: d.nivel_riesgo,
        diagnostico: d.diagnostico
    }));

    wsDesc.addRow({});
    wsDesc.addRow({ medico: `GENERAL (n = ${descriptiva.n_total})`, diagnostico: descriptiva.diagnostico_general });
    const mp = descriptiva.medidas_posicion || {};
    const g = descriptiva.general || {};
    [
        ['Mínimo (min)', mp.min],
        ['Primer cuartil Q1 (min)', mp.q1],
        ['Mediana Q2 (min)', mp.mediana],
        ['Tercer cuartil Q3 (min)', mp.q3],
        ['Máximo (min)', mp.max],
        ['Rango intercuartílico IQR (min)', mp.iqr],
        ['Media global (min)', g.media],
        ['Varianza muestral', g.varianza],
        ['Desvío estándar (min)', g.desviacion],
        ['CV global (%)', g.cv]
    ].forEach(([campo, valor]) => wsDesc.addRow({ medico: campo, especialidad: redondear(valor) }));

    // ---------- Hoja 2: PARTE 1 · Regresión e inferencia ----------
    const wsReg = wb.addWorksheet('1b-Muestra-Regresion');
    wsReg.columns = [
        { header: 'Métrica', key: 'metrica', width: 46 },
        { header: 'Modelo Edad vs Tiempo', key: 'edad', width: 22 },
        { header: 'Modelo Experiencia vs Tiempo', key: 'exp', width: 22 }
    ];
    const infE = regresion.inferencia_edad || {};
    const infX = regresion.inferencia_exp || {};
    const mE = regresion.modelo_edad || {};
    const mX = regresion.modelo_exp || {};

    wsReg.addRow({ metrica: 'Pendiente b', edad: redondear(mE.b, 4), exp: redondear(mX.b, 4) });
    wsReg.addRow({ metrica: 'Ordenada al origen a', edad: redondear(mE.a), exp: redondear(mX.a) });
    wsReg.addRow({ metrica: 'Correlación de Pearson r', edad: redondear(mE.r, 4), exp: redondear(mX.r, 4) });
    wsReg.addRow({ metrica: 'Determinación R²', edad: redondear(mE.r2, 4), exp: redondear(mX.r2, 4) });
    wsReg.addRow({ metrica: 'R² ajustado', edad: redondear(infE.r2_ajustado, 4), exp: redondear(infX.r2_ajustado, 4) });
    wsReg.addRow({ metrica: 'Covarianza muestral', edad: redondear(mE.cov_xy), exp: redondear(mX.cov_xy) });
    wsReg.addRow({ metrica: 'ρ de Spearman (edad vs tiempo)', edad: redondear(regresion.spearman_edad, 4), exp: '-' });
    wsReg.addRow({ metrica: 'Error estándar de la estimación se', edad: redondear(mE.se, 3), exp: redondear(mX.se, 3) });
    wsReg.addRow({ metrica: 'Error estándar de la pendiente se(b)', edad: redondear(infE.se_b, 5), exp: redondear(infX.se_b, 5) });
    wsReg.addRow({ metrica: 'Estadístico t (pendiente)', edad: redondear(infE.t, 3), exp: redondear(infX.t, 3) });
    wsReg.addRow({ metrica: 'Grados de libertad', edad: infE.gl, exp: infX.gl });
    wsReg.addRow({ metrica: 'Valor p (bilateral)', edad: infE.p_valor, exp: infX.p_valor });
    wsReg.addRow({ metrica: 'Decisión (α = 0.05)', edad: infE.significativo ? 'H0 RECHAZADA' : 'H0 NO rechazada', exp: infX.significativo ? 'H0 RECHAZADA' : 'H0 NO rechazada' });
    wsReg.addRow({ metrica: 'IC 95% pendiente (límite inf)', edad: redondear(infE.ic_pendiente ? infE.ic_pendiente[0] : null, 4), exp: redondear(infX.ic_pendiente ? infX.ic_pendiente[0] : null, 4) });
    wsReg.addRow({ metrica: 'IC 95% pendiente (límite sup)', edad: redondear(infE.ic_pendiente ? infE.ic_pendiente[1] : null, 4), exp: redondear(infX.ic_pendiente ? infX.ic_pendiente[1] : null, 4) });
    wsReg.addRow({ metrica: 'Cooldown sugerido (min)', edad: regresion.cooldown_sugerido || 5, exp: '-' });

    const anova = infE.anova || {};
    wsReg.addRow({});
    wsReg.addRow({ metrica: 'TABLA ANOVA (Modelo Edad vs Tiempo)' });
    wsReg.addRow({ metrica: 'Fuente', edad: 'Suma de cuadrados', exp: 'gl' });
    wsReg.addRow({ metrica: 'Regresión (explicada)', edad: redondear(anova.sce), exp: anova.gl_reg });
    wsReg.addRow({ metrica: 'Residuos (no explicada)', edad: redondear(anova.scr), exp: anova.gl_res });
    wsReg.addRow({ metrica: 'Total', edad: redondear(anova.sct), exp: anova.gl_tot });
    wsReg.addRow({ metrica: 'F', edad: redondear(anova.F), exp: 'Valor p: ' + anova.p });

    // ---------- Hoja 3: PARTE 1 · Outliers ----------
    const wsOut = wb.addWorksheet('1c-Muestra-Outliers');
    wsOut.columns = [
        { header: 'Médico', key: 'medico', width: 24 },
        { header: 'Edad', key: 'edad', width: 8 },
        { header: 'Tiempo real', key: 'real', width: 12 },
        { header: 'Tiempo predicho', key: 'pred', width: 14 },
        { header: 'Residuo', key: 'residuo', width: 10 },
        { header: 'se', key: 'se', width: 10 }
    ];
    regresion.outliers.forEach(o => wsOut.addRow({
        medico: o.info.medico || '-',
        edad: o.x,
        real: o.y_real,
        pred: redondear(o.y_pred),
        residuo: redondear(o.residuo),
        se: redondear(mE.se, 3)
    }));

    // ---------- Hoja 4: PARTE 2 · Turnos reales (detalle) ----------
    const wsTurnos = wb.addWorksheet('2a-Turnos-Detalle');
    wsTurnos.columns = [
        { header: 'Fecha', key: 'fecha', width: 12 },
        { header: 'Hora', key: 'hora', width: 10 },
        { header: 'Paciente', key: 'paciente', width: 22 },
        { header: 'Edad', key: 'edad', width: 8 },
        { header: 'Médico', key: 'medico', width: 22 },
        { header: 'Especialidad', key: 'especialidad', width: 16 },
        { header: 'Tiempo estimado (min)', key: 'estimado', width: 16 },
        { header: 'Tiempo real (min)', key: 'real', width: 14 },
        { header: 'Demora (min)', key: 'demora', width: 12 },
        { header: 'Espera (min)', key: 'espera', width: 12 }
    ];
    turnos.registros.forEach(r => wsTurnos.addRow({
        fecha: r.fecha,
        hora: r.hora,
        paciente: r.paciente,
        edad: r.edad,
        medico: r.medico,
        especialidad: r.especialidad,
        estimado: r.estimado,
        real: r.real,
        demora: r.demora,
        espera: r.espera
    }));

    // ---------- Hoja 5: PARTE 2 · Indicadores reales por doctor ----------
    const wsDoc = wb.addWorksheet('2b-Turnos-Doctores');
    wsDoc.columns = [
        { header: 'Médico', key: 'medico', width: 24 },
        { header: 'Especialidad', key: 'especialidad', width: 18 },
        { header: 'n atendidos', key: 'n', width: 12 },
        { header: 'Media real (min)', key: 'media', width: 14 },
        { header: 'Desvío real (min)', key: 'desvio', width: 14 },
        { header: 'CV real (%)', key: 'cv', width: 12 },
        { header: 'Riesgo', key: 'riesgo', width: 8 },
        { header: 'Demora media (min)', key: 'demora', width: 14 },
        { header: 'Espera media (min)', key: 'espera', width: 14 },
        { header: 'n esperas', key: 'n_esperas', width: 10 }
    ];
    turnos.doctores.forEach(d => wsDoc.addRow({
        medico: d.medico,
        especialidad: d.especialidad,
        n: d.n_atendidos,
        media: d.media_real,
        desvio: d.desviacion_real,
        cv: d.cv_real,
        riesgo: d.nivel_riesgo,
        demora: d.media_demora,
        espera: d.media_espera,
        n_esperas: d.n_esperas
    }));

    // ---------- Hoja 6: PARTE 2 · Inferencia del modelo real ----------
    const wsInf = wb.addWorksheet('2c-Turnos-Inferencia');
    wsInf.columns = [
        { header: 'Métrica', key: 'metrica', width: 46 },
        { header: 'Valor', key: 'valor', width: 22 }
    ];
    const infR = turnos.inferencia_real || {};
    const mR = turnos.regresion_edad_real.modelo || {};
    const cal = turnos.regresion_calibracion || {};
    wsInf.addRow({ metrica: 'Correlación r (edad vs tiempo real)', valor: redondear(mR.r, 4) });
    wsInf.addRow({ metrica: 'Determinación R²', valor: redondear(mR.r2, 4) });
    wsInf.addRow({ metrica: 'R² ajustado', valor: redondear(infR.r2_ajustado, 4) });
    wsInf.addRow({ metrica: 'Error estándar se', valor: redondear(mR.se, 3) });
    wsInf.addRow({ metrica: 'Estadístico t (pendiente)', valor: redondear(infR.t, 3) });
    wsInf.addRow({ metrica: 'Valor p (bilateral)', valor: infR.p_valor });
    wsInf.addRow({ metrica: 'Decisión (α = 0.05)', valor: infR.significativo ? 'H0 RECHAZADA' : 'H0 NO rechazada' });
    wsInf.addRow({ metrica: 'IC 95% pendiente', valor: infR.ic_pendiente ? `[${redondear(infR.ic_pendiente[0], 4)} ; ${redondear(infR.ic_pendiente[1], 4)}]` : '-' });
    wsInf.addRow({ metrica: 'ρ Spearman (edad vs real)', valor: redondear(turnos.spearman_real, 4) });
    wsInf.addRow({ metrica: 'r calibración (estimado vs real)', valor: redondear(cal.r, 4) });
    wsInf.addRow({ metrica: 'ρ Spearman (estimado vs real)', valor: redondear(turnos.spearman_calibracion, 4) });

    return wb.xlsx.writeBuffer();
}

module.exports = { generarReporteExcel };
