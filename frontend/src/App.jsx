import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { authAPI, usersAPI, questionsAPI, answersAPI, matchesAPI } from './services/api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if user has a valid token
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchCurrentUser()
    } else {
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
    navigate('/')
    clearMessages()
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="app"><div className="container"><div className="card loading">Loading...</div></div></div>
    }
    if (!user) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  // Public Route Component (redirects to /survey if already logged in)
  const PublicRoute = ({ children }) => {
    if (loading) {
      return <div className="app"><div className="container"><div className="card loading">Loading...</div></div></div>
    }
    if (user && (location.pathname === '/login' || location.pathname === '/register')) {
      return <Navigate to="/survey" replace />
    }
    return children
  }

  if (loading && !user) {
    return <div className="app"><div className="container"><div className="card loading">Loading...</div></div></div>
  }

  return (
    <div className="app">
      <div className="container">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <Routes>
          <Route path="/" element={
            <PublicRoute>
              <HomeView />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <LoginView 
                setUser={setUser}
                setError={setError}
                setSuccess={setSuccess}
                clearMessages={clearMessages}
              />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterView
                setUser={setUser}
                setError={setError}
                setSuccess={setSuccess}
                clearMessages={clearMessages}
              />
            </PublicRoute>
          } />
          <Route path="/survey" element={
            <ProtectedRoute>
              <AuthenticatedLayout user={user} onLogout={handleLogout} clearMessages={clearMessages}>
                <SurveyView 
                  setError={setError}
                  setSuccess={setSuccess}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />
          <Route path="/matches" element={
            <ProtectedRoute>
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

function AuthenticatedLayout({ user, onLogout, clearMessages, children }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <nav className="nav-tabs">
          <button 
            className={location.pathname === '/survey' ? 'active' : ''}
            onClick={() => { navigate('/survey'); clearMessages() }}
          >
            Answer Questions
          </button>
          <button 
            className={location.pathname === '/matches' ? 'active' : ''}
            onClick={() => { navigate('/matches'); clearMessages() }}
          >
            My Enemies
          </button>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#FFA586' }}>Welcome, {user.username}!</span>
          <button className="btn btn-secondary" onClick={onLogout} style={{ padding: '8px 16px' }}>
            Logout
          </button>
        </div>
      </div>
      {children}
    </>
  )
}

function HomeView() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <h1 className="landing-title">Nemesis</h1>
        <p className="landing-quote">Keep your friends close and your enemies closer.</p>
      </div>

      <div className="landing-content">
        <p className="landing-description">
          Answer controversial questions. We'll find your perfect enemy.
        </p>
        <p className="landing-subtext">
          The more you disagree, the better the match.
        </p>
      </div>

      <div className="landing-cta">
        <button className="btn btn-primary" onClick={() => navigate('/register')}>
          Begin
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/login')}>
          Return
        </button>
      </div>
    </div>
  )
}

function RegisterView({ setUser, setError, setSuccess, clearMessages }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await usersAPI.create(formData)
      setSuccess('Account created successfully! Please log in to continue.')
      setTimeout(() => {
        navigate('/login')
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account')
    }
  }

  return (
    <div className="card">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <label>Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary">Register</button>
          <button type="button" className="btn btn-secondary" onClick={() => { navigate('/'); clearMessages() }}>Back</button>
        </div>
      </form>
    </div>
  )
}

function LoginView({ setUser, setError, setSuccess, clearMessages }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      console.log("asda23sd")

      const tokenData = await authAPI.login(email, password)
      // Store token before making authenticated requests
      console.log("asdasd")

      if (tokenData && tokenData.access_token) {
        localStorage.setItem('access_token', tokenData.access_token)
        
        // Fetch current user data immediately after storing token
        try {
          const userData = await authAPI.getCurrentUser()
          setUser(userData)
          setSuccess('Logged in successfully!')
          setTimeout(() => {
            navigate('/survey')
            setSuccess('')
          }, 1000)
        } catch (userErr) {
          // If getting user fails, token might be invalid
          console.error('Error fetching user:', userErr)
          localStorage.removeItem('access_token')
          setError('Failed to authenticate. Please try again.')
        }
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.detail || 'Failed to login')
      // Clear token if login fails
      localStorage.removeItem('access_token')
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary">Login</button>
          <button type="button" className="btn btn-secondary" onClick={() => { navigate('/'); clearMessages() }}>Back</button>
        </div>
      </form>
    </div>
  )
}

function SurveyView({ setError, setSuccess }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuestions()
    fetchUserAnswers()
  }, [])

  const fetchQuestions = async () => {
    try {
      const questionsData = await questionsAPI.getAll(true)
      setQuestions(questionsData)
      setLoading(false)
    } catch (err) {
      setError('Failed to load questions')
      setLoading(false)
    }
  }

  const fetchUserAnswers = async () => {
    try {
      const answersData = await answersAPI.getUserAnswers()
      const answerMap = {}
      const answeredIds = new Set()
      answersData.forEach(ans => {
        answerMap[ans.question_id] = ans.answer_value
        answeredIds.add(ans.question_id)
      })
      setAnswers(answerMap)
      setAnsweredQuestionIds(answeredIds)
    } catch (err) {
      console.error('Error fetching answers:', err)
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const answerList = Object.entries(answers).map(([questionId, value]) => ({
      question_id: parseInt(questionId),
      answer_value: value
    }))

    try {
      await answersAPI.submitSurvey({ answers: answerList })
      setSuccess('Answers saved successfully!')
      fetchUserAnswers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save answers')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="card loading">Loading questions...</div>
  }

  if (questions.length === 0) {
    return <div className="card">No questions available yet. Check back later!</div>
  }

  // Separate questions into answered and unanswered
  const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q.id))
  const answeredQuestions = questions.filter(q => answeredQuestionIds.has(q.id))

  return (
    <div className="card">
      <h2>Answer Questions</h2>
      <p style={{ marginBottom: '20px' }}>
        Rate each statement from 1 (Strongly Disagree) to 10 (Strongly Agree).
        You can update your answers at any time.
      </p>
      
      {unansweredQuestions.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#FFA586', marginBottom: '15px' }}>
            New Questions ({unansweredQuestions.length})
          </h3>
          {unansweredQuestions.map(question => (
            <div key={question.id} className="question-item" style={{ borderLeft: '4px solid #B51A2B' }}>
              <label>{question.text}</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={answers[question.id] || 5}
                  onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">
                  {answers[question.id] || 5} / 10
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {answeredQuestions.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#FFA586', marginBottom: '15px' }}>
            Your Answers ({answeredQuestions.length})
          </h3>
          <p style={{ fontSize: '14px', color: '#888', marginBottom: '15px' }}>
            You can modify your answers below
          </p>
          {answeredQuestions.map(question => (
            <div key={question.id} className="question-item" style={{ borderLeft: '4px solid #541A2E' }}>
              <label>{question.text}</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={answers[question.id] || 5}
                  onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">
                  {answers[question.id] || 5} / 10
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button 
        type="button"
        onClick={handleSubmit}
        className="btn btn-primary" 
        disabled={submitting || Object.keys(answers).length === 0}
        style={{ marginTop: '20px', width: '100%' }}
      >
        {submitting ? 'Saving...' : 'Save Answers'}
      </button>
    </div>
  )
}

function MatchesView({ setError }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const matchesData = await matchesAPI.getUserMatches()
      setMatches(matchesData)
      setLoading(false)
    } catch (err) {
      setError('Failed to load matches')
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="card loading">Loading matches...</div>
  }

  return (
    <div className="card">
      <h2>My Enemy Matches</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Your matches are generated automatically by administrators. New matches appear here after each monthly matching cycle.
      </p>
      {matches.length === 0 ? (
        <p>No matches yet. Complete the survey and wait for the next matching cycle!</p>
      ) : (
        <div className="matches-list">
          {matches.map(match => (
            <div key={match.id} className="match-item">
              <h3>🎯 {match.enemy_username}</h3>
              <p><strong>Email:</strong> {match.enemy_email}</p>
              <p><strong>Incompatibility Score:</strong> {match.match_score}/100</p>
              <p><strong>Matched:</strong> {new Date(match.matched_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
