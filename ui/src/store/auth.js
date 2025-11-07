import { defineStore } from 'pinia'
import authApi from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    userId: localStorage.getItem('userId') || null,
    email: localStorage.getItem('email') || null,
    role: localStorage.getItem('role') || 'guest',
    user: null, // Full user object with score
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getToken: (state) => state.token,
    getUserId: (state) => state.userId,
    getEmail: (state) => state.email,
    getRole: (state) => state.role,
    getUserScore: (state) => state.user?.rank || 0,
  },
  actions: {
    async register(payload) {
   
      const { data } = await authApi.post('/register', payload)
  
      return data
    },
    async login(credentials) {
  
      const { data } = await authApi.post('/login', credentials)
  
      const token = data?.token || data?.accessToken
      const user = data?.user || {}
      if (token) {
        this.setToken(token)
      }
      if (user?.id) this.setUserId(String(user.id))
      if (user?.email) this.setEmail(user.email)
      if (user?.role) this.setRole(String(user.role))
      
      // Fetch full user profile to get score
      if (user?.id) {
        await this.fetchUserProfile()
      }
      
      return data
    },
    async fetchUserProfile() {
      try {
        const userApi = (await import('../api/user')).default
        const response = await userApi.get(`/${this.userId}`)
        this.user = response.data.user
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    },
    logout() {
      this.token = null
      this.userId = null
      this.email = null
      this.role = 'guest'
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('email')
      localStorage.removeItem('role')
    },
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    setUserId(userId) {
      this.userId = userId
      localStorage.setItem('userId', userId)
    },
    setEmail(email) {
      this.email = email
      localStorage.setItem('email', email)
    },
    setRole(role) {
      this.role = role
      localStorage.setItem('role', role)
    }
  },
})
