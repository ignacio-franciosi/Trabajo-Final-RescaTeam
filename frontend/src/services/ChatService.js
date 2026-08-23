import apiChat from './axiosConfigChat';

const ChatService = {
  startChat: (token, { receiverId, postId }) =>
    apiChat.post('/api/chat/start', { receiverId, postId }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  listChats: (token, limit = 20) =>
    apiChat.get(`/api/chat/list?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  listMessages: (token, chatId, limit = 50) =>
    apiChat.get(`/api/chat/${chatId}/messages?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  markRead: (token, chatId) =>
    apiChat.post(`/api/chat/${chatId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Fallback HTTP (si no usás WS)
  sendHttp: (token, chatId, content) =>
    apiChat.post(`/api/chat/${chatId}/send`, { content }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default ChatService;
export { ChatService };
