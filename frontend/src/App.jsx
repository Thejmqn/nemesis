import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { authAPI } from './services/api'
import HomeView from './components/HomeView'
import LoginView from './components/LoginView'
import RegisterView from './components/RegisterView'
import SurveyView from './components/SurveyView'
import MatchesView from './components/MatchesView'
import AuthenticatedLayout from './components/AuthenticatedLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user has a valid token
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchCurrentUser()
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser()
      setUser(userData)
    } catch (err) {
      // Token invalid, clear it
      authAPI.logout()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    authAPI.logout()
    setUser(null)
    clearMessages()
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="app">
      <div className="container">
        {error && <div className="error" role="alert" aria-live="assertive">{error}</div>}
        {success && <div className="success" role="status" aria-live="polite">{success}</div>}

        <Routes>
          <Route path="/" element={
            <PublicRoute user={user} loading={loading}>
              <HomeView />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute user={user} loading={loading}>
              <LoginView 
                setUser={setUser}
                setError={setError}
                setSuccess={setSuccess}
                clearMessages={clearMessages}
              />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute user={user} loading={loading}>
              <RegisterView
                setError={setError}
                setSuccess={setSuccess}
                clearMessages={clearMessages}
              />
            </PublicRoute>
          } />
          <Route path="/survey" element={
            <ProtectedRoute user={user} loading={loading}>
              <AuthenticatedLayout user={user} onLogout={handleLogout} clearMessages={clearMessages}>
                <SurveyView 
                  setError={setError}
                  setSuccess={setSuccess}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />
          <Route path="/matches" element={
            <ProtectedRoute user={user} loading={loading}>
              <AuthenticatedLayout user={user} onLogout={handleLogout} clearMessages={clearMessages}>
                <MatchesView 
                  setError={setError}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
