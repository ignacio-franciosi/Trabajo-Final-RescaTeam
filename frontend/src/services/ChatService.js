import { axiosChat } from './axiosConfigChat';

export const ChatApi = {
  startChat: (token, { receiverId, postId }) =>
    axiosChat.post('/api/chat/start', { receiverId, postId }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  listChats: (token, limit = 20) =>
    axiosChat.get(`/api/chat/list?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  listMessages: (token, chatId, limit = 50) =>
    axiosChat.get(`/api/chat/${chatId}/messages?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  markRead: (token, chatId) =>
    axiosChat.post(`/api/chat/${chatId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Fallback HTTP enviar (no suele usarse si tenés WS)
  sendHttp: (token, chatId, content) =>
    axiosChat.post(`/api/chat/${chatId}/send`, { content }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
