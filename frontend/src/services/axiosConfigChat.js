// src/services/axiosConfigChat.js
import axios from 'axios';

export const axiosChat = axios.create({
  baseURL: import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8083', // puerto del microservicio de CHAT
  withCredentials: true,
});

axiosChat.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default axiosChat;