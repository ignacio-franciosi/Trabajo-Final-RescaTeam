import axios from 'axios';

// Prefer explicit env var when available (useful for testing or production builds)
const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL;

const getBaseURL = () => {
  if (SEARCH_API_URL) return SEARCH_API_URL;
  // If running in browser on same machine, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  // For PWA on mobile accessing the app via PC IP, construct host based on current hostname
  return `http://${window.location.hostname}:8000`;
};

const apiSearch = axios.create({
  baseURL: getBaseURL(),
});

// Agregar token a todas las requests (si existe)
//api.interceptors.request.use((config) => {
//  const token = localStorage.getItem('token');
//  if (token) {
//    config.headers.Authorization = `Bearer ${token}`;
//  }
//  return config;
//});

export default apiSearch;