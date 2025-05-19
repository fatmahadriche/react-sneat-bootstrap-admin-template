import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_API_URL,// Base URL sans /auth
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
// Modifier l'intercepteur de réponse axios :
api.interceptors.response.use(
    response => response,
    error => {
        if (!error.response) {
            error.response = {
                data: { 
                    error: "Problème de connexion. Vérifiez votre accès Internet."
                }
            };
        }

        if (error.response.status === 401) {
            localStorage.clear();
            window.location.href = `/auth/login?sessionExpired=true`;
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