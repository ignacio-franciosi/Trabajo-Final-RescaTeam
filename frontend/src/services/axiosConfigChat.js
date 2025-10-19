// src/services/axiosConfigChat.js
import axios from 'axios';

const apiChat = axios.create({
  baseURL: 'http://localhost:8083', // puerto del microservicio de CHAT
});

apiChat.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiChat;