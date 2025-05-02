import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000", // Base URL sans /auth
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur pour gérer les erreurs globales
// Dans api.js
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Délai pour éviter les conflits React
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/auth/login?expired=true';
            }, 2000);
        }
        // Ne pas propager les erreurs 403
        if (error.response?.status !== 403) {
            return Promise.reject(error);
        }
    }
);
window.addEventListener('storage', (event) => {
    if (event.key === 'token' && !event.newValue) {
        window.location.href = '/auth/login';
    }
});

export default api;