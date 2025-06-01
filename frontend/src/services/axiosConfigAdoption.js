import axios from 'axios';

const apiAdoption = axios.create({
  baseURL: 'http://localhost:8090', // puerto del microservicio de ADOPTION
});

apiAdoption.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiAdoption;
