/**
 * @file api_service.js
 * @brief Cliente Fetch centralizado con inyección automática del JWT.
 * @project Consultora Médica
 */

const API_URL = '/api';

const apiService = {
    async request(endpoint, method = 'GET', data = null) {
        const token = authHelper.getToken();

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { method, headers };
        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);
        const result = await response.json();

        if (response.status === 401) {
            authHelper.logout();
        }

        if (!response.ok) {
            throw new Error(result.message || 'Error en la petición');
        }

        return result;
    }
};
