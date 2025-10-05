import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  login: (username, password, isAdmin) => 
    api.post('/auth/login', { username, password, isAdmin }),
};

export const threadsAPI = {
  getAll: () => api.get('/threads'),
  create: (data) => api.post('/threads', data),
  update: (id, data) => api.put(`/threads/${id}`, data),  // ✅ ADD THIS LINE
  delete: (id, userId) => api.delete(`/threads/${id}`, { data: { userId } }),
  requestJoin: (id, userId) => api.post(`/threads/${id}/join`, { userId }),
  handleRequest: (id, userId, approve, currentUserId) => 
    api.post(`/threads/${id}/requests`, { userId, approve, currentUserId }),
  sendMessage: (id, data) => api.post(`/threads/${id}/messages`, data),
};

export const adminAPI = {
  getDashboard: (userId) => api.get(`/admin/dashboard?userId=${userId}`),
};

export default api;