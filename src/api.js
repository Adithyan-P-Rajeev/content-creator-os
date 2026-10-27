import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3002'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

function authConfig() {
  const token = localStorage.getItem('contentCreatorToken')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

function tokenConfig(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export const itemsApi = {
  async getAll() {
    const response = await api.get('/items', authConfig())
    return response.data
  },
  async create(payload) {
    const response = await api.post('/items', payload, authConfig())
    return response.data
  },
  async update(id, changes) {
    const response = await api.patch(`/items/${id}`, changes, authConfig())
    return response.data
  },
  async remove(id) {
    const response = await api.delete(`/items/${id}`, authConfig())
    return response.status === 204 ? null : response.data
  },
  async uploadImage(dataUrl, itemId) {
    const response = await api.post('/media/upload', { dataUrl, itemId }, authConfig())
    return response.data
  },
  async deleteImage(publicId) {
    await api.delete(`/media/${encodeURIComponent(publicId)}`, authConfig())
  },
  async syncCalendar(id) {
    const response = await api.post(`/items/${id}/sync-calendar`, {}, authConfig())
    return response.data
  },
}

export const authApi = {
  async login(email, password) {
    const response = await axios.post(`${AUTH_URL}/auth/login`, { email, password })
    return response.data
  },
  async register(name, email, password, journey) {
    const response = await axios.post(`${AUTH_URL}/auth/register`, { name, email, password, journey })
    return response.data
  },
  async forgotPassword(email) {
    const response = await axios.post(`${AUTH_URL}/auth/forgot-password`, { email })
    return response.data
  },
  async resetPassword(resetToken, password) {
    const response = await axios.post(`${AUTH_URL}/auth/reset-password`, { resetToken, password })
    return response.data
  },
  async me(token) {
    const response = await axios.get(`${AUTH_URL}/auth/me`, tokenConfig(token))
    return response.data
  },
  async logout(token) {
    const response = await axios.post(`${AUTH_URL}/auth/logout`, {}, tokenConfig(token))
    return response.data
  },
  async updateProfile(token, journey) {
    const response = await axios.patch(`${AUTH_URL}/auth/profile`, { journey }, tokenConfig(token))
    return response.data
  },
  async calendarConnect(token) {
    const response = await axios.get(`${AUTH_URL}/auth/google/calendar`, tokenConfig(token))
    return response.data
  },
  async calendarDisconnect(token) {
    const response = await axios.post(`${AUTH_URL}/auth/google/calendar/disconnect`, {}, tokenConfig(token))
    return response.data
  },
}

export default api
