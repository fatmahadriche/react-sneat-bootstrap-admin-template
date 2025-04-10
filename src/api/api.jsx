import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000", // Base URL sans /auth
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
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
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);
window.addEventListener('storage', (event) => {
    if (event.key === 'token' && !event.newValue) {
        window.location.href = '/auth/login';
    }
});

export default api;