import axios from 'axios';

const api = axios.create({
  baseURL: 'https://users-production-6ead.up.railway.app',
  //baseURL: 'http://localhost:8080', // Reemplazá PORT con el puerto real de tu API users
});

// Agregar token a todas las requests (si existe)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export default api;

