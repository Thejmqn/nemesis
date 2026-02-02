import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (email, password) => {
    // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
  },
  
  getCurrentUser: async () => {
    // Ensure token is available
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No access token available')
    }
    const response = await api.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },
}

// Users API
export const usersAPI = {
  create: async (userData) => {
    const response = await api.post('/users/', userData)
    return response.data
  },
  
  getById: async (userId) => {
    const response = await api.get(`/users/${userId}`)
    return response.data
  },
}

// Questions API
export const questionsAPI = {
  getAll: async (activeOnly = true) => {
    const response = await api.get(`/questions/?active_only=${activeOnly}`)
    return response.data
  },
  
  getById: async (questionId) => {
    const response = await api.get(`/questions/${questionId}`)
    return response.data
  },
}

// Answers API
export const answersAPI = {
  submitSurvey: async (surveyData) => {
    const response = await api.post('/answers/survey', surveyData)
    return response.data
  },
  
  getUserAnswers: async () => {
    const response = await api.get('/answers/user')
    return response.data
  },
  
  update: async (answerId, answerValue) => {
    const response = await api.put(`/answers/${answerId}`, { answer_value: answerValue })
    return response.data
  },
}

// Matches API
export const matchesAPI = {
  getUserMatches: async () => {
    const response = await api.get('/matches/user')
    return response.data
  },
  
  getLatestMatch: async () => {
    const response = await api.get('/matches/user/latest')
    return response.data
  },
}

export default api
