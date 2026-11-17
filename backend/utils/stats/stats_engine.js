/**
 * @file stats_engine.js
 * @brief Motor estadístico: descriptiva univariada, regresión lineal,
 *        correlación de Pearson, R², error estándar y detección de outliers.
 * @details Port fiel de los scripts Python del TP original
 *          (2_descriptiva.py y 3_regresion.py) a JavaScript.
 * @project Consultora Médica
 */

/**
 * @brief Calcula media, varianza muestral, desvío estándar y Coeficiente de Variación.
 * @param {number[]} valores - Serie numérica.
 * @returns {Object|null} Estadísticas univariadas o null si n < 2.
 */
function estadisticasUnivariadas(valores) {
    const n = valores.length;
    if (n < 2) return null;

    const media = valores.reduce((acc, v) => acc + v, 0) / n;
    const sumaCuadrados = valores.reduce((acc, v) => acc + (v - media) ** 2, 0);
    const varianza = sumaCuadrados / (n - 1);
    const desviacion = Math.sqrt(varianza);
    const cv = media !== 0 ? (desviacion / media) * 100.0 : 0.0;

    return { n, media, varianza, desviacion, cv };
}

/**
 * @brief Interpreta el Coeficiente de Variación (umbrales del TP original).
 * @param {number} cv - Coeficiente de variación en %.
 * @returns {{diagnostico: string, nivelRiesgo: string}}
 */
function clasificarHomogeneidad(cv) {
    if (cv < 15.0) {
        return {
            diagnostico: 'ALTA HOMOGENEIDAD (Excelente estabilidad operativa)',
            nivelRiesgo: 'BAJA'
        };
    }
    if (cv <= 30.0) {
        return {
            diagnostico: 'VARIABILIDAD MODERADA (Aceptable, requiere monitoreo)',
            nivelRiesgo: 'MEDIA'
        };
    }
    return {
        diagnostico: 'ALTA DISPERSIÓN (Inconsistente, potencial cuello de botella)',
        nivelRiesgo: 'ALTA'
    };
}

/**
 * @brief Modelo bivariado completo por Mínimos Cuadrados.
 * @param {number[]} x - Variable explicativa.
 * @param {number[]} y - Variable respuesta.
 * @param {Array<Object>} [extras] - Registros extra asociados a cada punto (para reportar outliers).
 * @returns {Object} Modelo con a, b, r, r2, se, residuos y outliers.
 */
function modeloBivariado(x, y, extras = null) {
    const n = x.length;
    if (n < 3) {
        return {
            n,
            mean_x: n > 0 ? x.reduce((a, b) => a + b, 0) / n : 0,
            mean_y: n > 0 ? y.reduce((a, b) => a + b, 0) / n : 0,
            ss_xx: 0, ss_yy: 0, ss_xy: 0, cov_xy: 0,
            a: 0, b: 0, r: 0, r2: 0, se: 0,
            y_pred: [...y],
            residuos: y.map(() => 0),
            outliers: []
        };
    }

    const mean_x = x.reduce((a, b) => a + b, 0) / n;
    const mean_y = y.reduce((a, b) => a + b, 0) / n;

    const ss_xx = x.reduce((acc, xi) => acc + (xi - mean_x) ** 2, 0);
    const ss_yy = y.reduce((acc, yi) => acc + (yi - mean_y) ** 2, 0);
    const ss_xy = x.reduce((acc, xi, i) => acc + (xi - mean_x) * (y[i] - mean_y), 0);

    const cov_xy = ss_xy / (n - 1);
    const b = ss_xx !== 0 ? ss_xy / ss_xx : 0.0;
    const a = mean_y - b * mean_x;

    const denominadorR = Math.sqrt(ss_xx * ss_yy);
    const r = denominadorR !== 0 ? ss_xy / denominadorR : 0.0;
    const r2 = r ** 2;

    const y_pred = x.map(xi => a + b * xi);
    const residuos = y.map((yi, i) => yi - y_pred[i]);
    const sumaResiduosCuad = residuos.reduce((acc, e) => acc + e ** 2, 0);
    const se = n > 2 ? Math.sqrt(sumaResiduosCuad / (n - 2)) : 0.0;

    const outliers = [];
    for (let idx = 0; idx < n; idx++) {
        if (se > 0 && Math.abs(residuos[idx]) > 2.0 * se) {
            outliers.push({
                indice: idx,
                x: x[idx],
                y_real: y[idx],
                y_pred: y_pred[idx],
                residuo: residuos[idx],
                info: extras ? extras[idx] : {}
            });
        }
    }

    return { n, mean_x, mean_y, ss_xx, ss_yy, ss_xy, cov_xy, a, b, r, r2, se, y_pred, residuos, outliers };
}

/**
 * @brief Interpreta la fuerza y el sentido de una correlación de Pearson.
 * @param {number} r - Coeficiente de correlación.
 * @returns {{fuerza: string, sentido: string}}
 */
function interpretarCorrelacion(r) {
    const absR = Math.abs(r);
    const sentido = r > 0 ? 'DIRECTA / POSITIVA' : 'INVERSA / NEGATIVA';
    let fuerza;

    if (absR >= 0.85) fuerza = 'MUY FUERTE';
    else if (absR >= 0.65) fuerza = 'MODERADA A FUERTE';
    else if (absR >= 0.35) fuerza = 'DÉBIL';
    else fuerza = 'PRÁCTICAMENTE NULA / DESPRECIABLE';

    return { fuerza, sentido };
}

/**
 * @brief Predice el tiempo de turno y el bloque de agenda sugerido (margen 5 min).
 * @param {number} a - Ordenada al origen.
 * @param {number} b - Pendiente.
 * @param {number} valorX - Edad del paciente.
 * @param {number} [margenSeguridad=5.0] - Margen de seguridad en minutos.
 * @returns {{yEstimado: number, bloqueRecomendado: number}}
 */
function predecirTiempoTurno(a, b, valorX, margenSeguridad = 5.0) {
    const yEstimado = a + b * valorX;
    const bloqueRecomendado = Math.ceil((yEstimado + margenSeguridad) / 5.0) * 5;
    return { yEstimado, bloqueRecomendado };
}

/**
 * @brief Medidas de posición: mínimo, cuartiles, mediana, máximo y rango intercuartílico.
 * @param {number[]} valores - Serie numérica.
 * @returns {Object|null}
 */
function cuartiles(valores) {
    const n = valores.length;
    if (n === 0) return null;
    const ordenados = [...valores].sort((a, b) => a - b);
    const cuantil = (q) => {
        const pos = q * (n - 1);
        const base = Math.floor(pos);
        const resto = pos - base;
        return ordenados[base] + (ordenados[base + 1] !== undefined ? (ordenados[base + 1] - ordenados[base]) * resto : 0);
    };
    const q1 = cuantil(0.25);
    const mediana = cuantil(0.5);
    const q3 = cuantil(0.75);
    return {
        n,
        min: ordenados[0],
        q1,
        mediana,
        q3,
        max: ordenados[n - 1],
        iqr: q3 - q1
    };
}

/**
 * @brief Coeficiente de correlación por rangos de Spearman.
 * @param {number[]} x - Serie numérica.
 * @param {number[]} y - Serie numérica.
 * @returns {number} rho de Spearman.
 */
function spearman(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 3) return 0;

    const rangos = (serie) => {
        const conIndice = serie.map((v, i) => ({ v, i }));
        conIndice.sort((a, b) => a.v - b.v);
        const r = new Array(n);
        for (let i = 0; i < n; i++) r[conIndice[i].i] = i + 1;
        return r;
    };

    const rx = rangos(x);
    const ry = rangos(y);
    return pearsonDePares(rx, ry);
}

function pearsonDePares(x, y) {
    const n = x.length;
    const mx = x.reduce((a, b) => a + b, 0) / n;
    const my = y.reduce((a, b) => a + b, 0) / n;
    let sxx = 0, syy = 0, sxy = 0;
    for (let i = 0; i < n; i++) {
        sxx += (x[i] - mx) ** 2;
        syy += (y[i] - my) ** 2;
        sxy += (x[i] - mx) * (y[i] - my);
    }
    const den = Math.sqrt(sxx * syy);
    return den !== 0 ? sxy / den : 0;
}

// ---------- Funciones auxiliares para inferencia (distribución t de Student) ----------

function lgamma(z) {
    // Aproximación de Lanczos
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) {
        return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    }
    z -= 1;
    let x = c[0];
    for (let i = 1; i < 9; i++) x += c[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(a, b, x) {
    const MAXIT = 200;
    const EPS = 3e-12;
    const FPMIN = 1e-300;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        h *= d * c;

        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < EPS) break;
    }
    return h;
}

function betai(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) {
        return (bt * betacf(a, b, x)) / a;
    }
    return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/**
 * @brief Valor p bilateral del test t: p = I(df/(df+t²), df/2, 1/2).
 * @param {number} t - Estadístico t.
 * @param {number} gl - Grados de libertad.
 * @returns {number} Valor p entre 0 y 1.
 */
function pValorT(t, gl) {
    if (gl <= 0) return 1;
    const x = gl / (gl + t * t);
    return betai(gl / 2, 0.5, x);
}

/**
 * @brief Valor crítico t bilateral para un nivel de significancia alpha (bisección).
 * @param {number} gl - Grados de libertad.
 * @param {number} [alpha=0.05] - Nivel de significancia.
 * @returns {number} t crítico.
 */
function tCritico(gl, alpha = 0.05) {
    if (gl <= 0) return 1.96;
    let lo = 0;
    let hi = 10;
    while (pValorT(hi, gl) >= alpha) hi *= 2;
    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        const p = pValorT(mid, gl);
        if (p > alpha) lo = mid;
        else hi = mid;
    }
    return (lo + hi) / 2;
}

/**
 * @brief Inferencia completa sobre un modelo de regresión:
 *        test t de la pendiente, valor p, R² ajustado, IC 95% de b y tabla ANOVA.
 * @param {Object} m - Modelo devuelto por modeloBivariado.
 * @returns {Object}
 */
function inferenciaModelo(m) {
    const n = m.n;
    if (n < 3 || m.ss_xx === 0) {
        return {
            se_b: null, t: null, gl: null, p_valor: null, significativo: null,
            r2_ajustado: null, ic_pendiente: [null, null],
            anova: { sct: null, sce: null, scr: null, gl_reg: null, gl_res: null, gl_tot: null, cm_reg: null, cm_res: null, F: null, p: null }
        };
    }

    const gl = n - 2;
    const se_b = m.se / Math.sqrt(m.ss_xx);
    const t = se_b !== 0 ? m.b / se_b : 0;
    const p = pValorT(t, gl);
    const tCrit = tCritico(gl, 0.05);
    const r2Ajustado = 1 - (1 - m.r2) * ((n - 1) / (n - 2));

    // Tabla ANOVA
    const sct = m.ss_yy;
    const sce = m.b * m.ss_xy;
    const scr = sct - sce;
    const glReg = 1;
    const glRes = n - 2;
    const glTot = n - 1;
    const cmReg = sce / glReg;
    const cmRes = scr / glRes;
    const F = cmRes !== 0 ? cmReg / cmRes : 0;

    return {
        se_b,
        t,
        gl,
        p_valor: p,
        significativo: p < 0.05,
        r2_ajustado: r2Ajustado,
        ic_pendiente: [m.b - tCrit * se_b, m.b + tCrit * se_b],
        t_critico: tCrit,
        anova: { sct, sce, scr, gl_reg: glReg, gl_res: glRes, gl_tot: glTot, cm_reg: cmReg, cm_res: cmRes, F, p }
    };
}

module.exports = {
    estadisticasUnivariadas,
    clasificarHomogeneidad,
    modeloBivariado,
    interpretarCorrelacion,
    predecirTiempoTurno,
    cuartiles,
    spearman,
    pValorT,
    tCritico,
    inferenciaModelo
};
