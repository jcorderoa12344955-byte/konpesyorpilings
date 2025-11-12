import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - Token may be invalid or expired')
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => {
    const formData = new FormData()
    formData.append('username', data.email)
    formData.append('password', data.password)
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getMe: () => api.get('/auth/me'),
}

// Confessions API
export const confessionsAPI = {
  getConfessions: (params) => api.get('/confessions', { params }),
  getConfession: (id) => api.get(`/confessions/${id}`),
  createConfession: (data) => api.post('/confessions', data),
  deleteConfession: (id) => api.delete(`/confessions/${id}`),
}

// Reactions API
export const reactionsAPI = {
  createReaction: (data) => api.post('/reactions', data),
  deleteReaction: (id) => api.delete(`/reactions/${id}`),
  getConfessionReactions: (id) => api.get(`/reactions/confession/${id}`),
}

// Comments API
export const commentsAPI = {
  getComments: (confessionId) => api.get(`/comments/confession/${confessionId}`),
  getReplies: (commentId) => api.get(`/comments/${commentId}/replies`),
  createComment: (data) => api.post('/comments', data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
}

// Reports API
export const reportsAPI = {
  createReport: (data) => api.post('/reports', data),
  getReports: (params) => api.get('/reports', { params }),
  reviewReport: (id, action) => api.put(`/reports/${id}/review`, null, { params: { action } }),
}

// Campuses API
export const campusesAPI = {
  getCampuses: () => api.get('/campuses'),
  getCampus: (id) => api.get(`/campuses/${id}`),
  createCampus: (data) => api.post('/campuses', data),
  updateCampus: (id, data) => api.put(`/campuses/${id}`, data),
  deleteCampus: (id) => api.delete(`/campuses/${id}`),
}

// Tags API
export const tagsAPI = {
  getTags: () => api.get('/tags'),
  createTag: (data) => api.post('/tags', data),
  toggleTag: (id, isAllowed) => api.put(`/tags/${id}/allow`, null, { params: { is_allowed: isAllowed } }),
  deleteTag: (id) => api.delete(`/tags/${id}`),
}

// Search API
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
}

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id, isBanned) => api.put(`/admin/users/${id}/ban`, null, { params: { is_banned: isBanned } }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  hideConfession: (id, isHidden) => api.put(`/admin/confessions/${id}/hide`, null, { params: { is_hidden: isHidden } }),
  hideComment: (id, isHidden) => api.put(`/admin/comments/${id}/hide`, null, { params: { is_hidden: isHidden } }),
  getConfessions: (params) => api.get('/admin/confessions', { params }),
  getConfessionsByCampus: (campusId, params) => api.get(`/admin/campuses/${campusId}/confessions`, { params }),
}

