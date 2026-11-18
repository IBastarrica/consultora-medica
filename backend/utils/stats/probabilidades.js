/**
 * @file probabilidades.js
 * @brief Módulo de Probabilidades: distribución normal, cuantiles y binomial.
 * @details Unidad 2 de la materia: variable aleatoria continua (normal) y discreta (binomial).
 * @project Consultora Médica
 */

/**
 * @brief Función error de Gauss (aproximación de Abramowitz & Stegun 7.1.26).
 */
function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

/**
 * @brief CDF de la distribución normal N(media, desvio).
 */
function normalCDF(x, media = 0, desvio = 1) {
    return 0.5 * (1 + erf((x - media) / (desvio * Math.SQRT2)));
}

/**
 * @brief P(X > x) para X ~ N(media, desvio).
 */
function probabilidadMayorQue(x, media, desvio) {
    return 1 - normalCDF(x, media, desvio);
}

/**
 * @brief P(a < X < b) para X ~ N(media, desvio).
 */
function probabilidadEntre(a, b, media, desvio) {
    return normalCDF(b, media, desvio) - normalCDF(a, media, desvio);
}

/**
 * @brief Cuantil de la normal estándar (aproximación de Acklam).
 * @param {number} p - Probabilidad acumulada (0..1).
 * @returns {number} z tal que P(Z <= z) = p.
 */
function cuantilNormal(p) {
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
        1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
        6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
        -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];
    const plow = 0.02425;
    const phigh = 1 - plow;

    if (p < plow) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > phigh) {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * @brief Coeficiente combinatorio C(n, k).
 */
function combinaciones(n, k) {
    if (k < 0 || k > n) return 0;
    let res = 1;
    for (let i = 1; i <= k; i++) {
        res *= (n - k + i) / i;
    }
    return Math.round(res);
}

/**
 * @brief P(X = k) para X ~ Binomial(n, p).
 */
function binomialPMF(p, n, k) {
    return combinaciones(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/**
 * @brief Tabla completa de probabilidades binomiales para k = 0..n.
 */
function tablaBinomial(p, n) {
    const tabla = [];
    for (let k = 0; k <= n; k++) {
        tabla.push({ k, probabilidad: binomialPMF(p, n, k) });
    }
    return tabla;
}

module.exports = {
    erf,
    normalCDF,
    probabilidadMayorQue,
    probabilidadEntre,
    cuantilNormal,
    binomialPMF,
    tablaBinomial
};
