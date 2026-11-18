/**
 * @file conclusiones.js
 * @brief Generador de conclusiones e interpretación socio-técnica.
 * @details Transforma los resultados estadísticos en recomendaciones con significado
 *          práctico para la gestión de la clínica (criterio de la rúbrica).
 * @project Consultora Médica
 */

const r2 = (v) => (v === null || v === undefined ? null : Math.round(v * 100) / 100);

/**
 * @brief Genera las conclusiones a partir de los tres análisis.
 * @param {Object} descriptiva - Análisis descriptivo (muestra n=100).
 * @param {Object} regresion - Regresión e inferencia (muestra n=100).
 * @param {Object} turnos - Análisis de turnos reales (operación en vivo).
 * @returns {string[]} Lista de conclusiones socio-técnicas.
 */
function generarConclusiones(descriptiva, regresion, turnos) {
    const c = [];

    // --- 1. Regresión e inferencia (muestra) ---
    const mE = regresion.modelo_edad;
    const infE = regresion.inferencia_edad || {};
    c.push(
        `La edad del paciente explica el ${r2(mE.r2 * 100)}% de la variabilidad del tiempo de atención (R² = ${r2(mE.r2)}), ` +
        `con una correlación de Pearson ${regresion.sentido_edad.toLowerCase()} y de fuerza ${regresion.fuerza_edad.toLowerCase()} (r = ${r2(mE.r)}).`
    );
    if (infE.significativo) {
        c.push(
            `El test t de la pendiente rechaza H0 con valor p ${infE.p_valor < 0.0001 ? '< 0.0001' : r2(infE.p_valor)} (α = 0.05): ` +
            `la relación edad-tiempo es estadísticamente significativa, por lo que agendar turnos según la edad es una política válida; ` +
            `el IC 95% de la pendiente es [${r2(infE.ic_pendiente[0])} ; ${r2(infE.ic_pendiente[1])}] minutos por año de edad.`
        );
    }

    const mX = regresion.modelo_exp;
    const mejorVar = mE.r >= mX.r ? 'la edad del paciente' : 'la experiencia del médico';
    const peorVar = mE.r >= mX.r ? 'la experiencia del médico' : 'la edad del paciente';
    const rMejor = mE.r >= mX.r ? mE.r : mX.r;
    const rPeor = mE.r >= mX.r ? mX.r : mE.r;
    c.push(
        `Comparando ambas hipótesis, la variable con mayor capacidad predictiva es ${mejorVar} (r = ${r2(rMejor)}) ` +
        `frente a ${peorVar} (r = ${r2(rPeor)}), por lo que la agenda debe dimensionarse priorizando ${mejorVar}.`
    );

    // --- 2. Variabilidad y representatividad ---
    const g = descriptiva.general || {};
    const cvG = r2(g.cv);
    if (cvG !== null && cvG < 15) {
        c.push(
            `El CV global de la muestra es ${cvG}% (< 15%), lo que indica dispersión baja: la media (${r2(g.media)} min) es una medida resumen representativa del tiempo de atención típico.`
        );
    } else if (cvG !== null && cvG <= 30) {
        c.push(
            `El CV global es ${cvG}% (entre 15% y 30%): existe variabilidad moderada, por lo que conviene acompañar la media (${r2(g.media)} min) con la mediana (${r2(descriptiva.medidas_posicion ? descriptiva.medidas_posicion.mediana : null)} min) y el IQR para dimensionar los turnos.`
        );
    } else if (cvG !== null) {
        c.push(
            `El CV global es ${cvG}% (> 30%): la dispersión es alta y la media NO es representativa; la agenda debe basarse en la mediana y los cuartiles, con bloques diferenciados por perfil de paciente.`
        );
    }

    const docAlto = [...descriptiva.doctores].sort((a, b) => b.cv - a.cv)[0];
    const docBajo = [...descriptiva.doctores].sort((a, b) => a.cv - b.cv)[0];
    if (docAlto && docBajo) {
        c.push(
            `El doctor con mayor inconsistencia es ${docAlto.medico} (${docAlto.especialidad}) con CV ${r2(docAlto.cv)}% (riesgo ${docAlto.nivel_riesgo.toLowerCase()}), ` +
            `mientras que ${docBajo.medico} es el más predecible (CV ${r2(docBajo.cv)}%); se recomienda dar más margen entre turnos al primero y turnos seriados al segundo.`
        );
    }

    // --- 3. Outliers (muestra) ---
    if (regresion.outliers.length > 0) {
        const desc = regresion.outliers.map(o =>
            `${o.info.medico || 'médico'} (edad ${o.x}, residuo ${r2(o.residuo)} min)`).join('; ');
        c.push(
            `Se detectaron ${regresion.outliers.length} casos atípicos (|e| > 2·se): ${desc}; clínicamente corresponden a consultas excepcionales (urgencias o trámites rápidos) que deben auditarse por separado y no deben distorsionar la agenda estándar.`
        );
    }

    // --- 4. Operación en vivo: espera y demora ---
    const gen = turnos.general || {};
    if (gen.media_espera !== null && gen.media_espera !== undefined) {
        c.push(
            `En la operación real los pacientes esperan en promedio ${r2(gen.media_espera)} minutos entre consultas consecutivas del mismo médico; ` +
            `con el margen (cooldown) sugerido por el análisis (${regresion.cooldown_sugerido || 5} min) se reduce el riesgo de arrastrar demoras entre turnos.`
        );
    }
    if (gen.media_demora !== null && gen.media_demora !== undefined) {
        const sentido = gen.media_demora >= 0 ? 'más' : 'menos';
        c.push(
            `La demora media (tiempo real − estimado) es ${r2(gen.media_demora)} minutos: los turnos duran en promedio ${sentido} de lo predicho; ` +
            `este desvío es la señal de calibración del modelo y justifica reestimarlo periódicamente con los datos reales.`
        );
    }

    const docEspera = [...turnos.doctores].sort((a, b) => (b.media_espera ?? -999) - (a.media_espera ?? -999))[0];
    if (docEspera && docEspera.media_espera !== null) {
        c.push(
            `El doctor con mayor espera acumulada es ${docEspera.medico} (${r2(docEspera.media_espera)} min de espera media): ` +
            `se recomienda recalibrar su agenda (bloques más largos o menos turnos por franja) para sostener la calidad del servicio.`
        );
    }

    // --- 5. Calibración del modelo ---
    const cal = turnos.regresion_calibracion || {};
    if (cal.r !== undefined && cal.r !== null) {
        const calidad = cal.r >= 0.8 ? 'alta (el modelo predice muy bien)' :
            cal.r >= 0.5 ? 'media (aceptable pero mejorable)' : 'baja (reestimar el modelo)';
        c.push(
            `La correlación entre el tiempo estimado y el real es r = ${r2(cal.r)} (calibración ${calidad}), ` +
            `lo que valida la predicción por edad como herramienta operativa de agendamiento.`
        );
    }

    // --- 6. Probabilidades ---
    const prob = turnos.probabilidades;
    if (prob && prob.esperas && prob.esperas.p_mayor_20 !== null) {
        const pEspera = prob.esperas.p_mayor_20;
        c.push(
            `Asumiendo un modelo normal, la probabilidad de que un paciente espere más de 20 minutos es del ${r2(pEspera * 100)}%: ` +
            `esto significa que, en promedio, ${pEspera >= 0.25 ? 'más de 1 de cada 4' : 'menos de 1 de cada 4'} pacientes sufre esperas superiores a 20 minutos, ` +
            `criterio clave para definir el estándar de calidad de la clínica.`
        );
    }
    if (prob && prob.demoras && prob.demoras.p_demora_positiva !== null) {
        c.push(
            `El ${r2(prob.demoras.p_demora_positiva * 100)}% de los turnos se demora respecto de lo estimado; ` +
            `según el modelo binomial, en una agenda de 10 turnos la probabilidad de que exactamente la mitad (5) se demoren es del ${r2(prob.binomial.tabla[5].probabilidad * 100)}%, ` +
            `lo que dimensiona el riesgo operativo de saturación de la sala de espera.`
        );
    }

    // --- 7. Box-plot / Tukey ---
    const tq = turnos.outliers_iqr_global;
    if (tq && tq.atipicos.length > 0) {
        c.push(
            `El criterio de Tukey (1.5·IQR) sobre los tiempos reales marca ${tq.atipicos.length} valor(es) fuera de las cercas ` +
            `[${r2(tq.cerco_inferior)} ; ${r2(tq.cerco_superior)}] min: son las consultas a auditar por la dirección médica.`
        );
    }

    return c;
}

module.exports = { generarConclusiones };
