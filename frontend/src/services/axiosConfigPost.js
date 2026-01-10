import axios from 'axios';

const apiAdoption = axios.create({
  baseURL: import.meta.env.VITE_POSTS_API_URL || 'http://localhost:8090',
});

apiAdoption.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiAdoption;
