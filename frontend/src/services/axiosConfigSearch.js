import axios from 'axios';

const apiSearch = axios.create({
  baseURL: 'http://localhost:8000',
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