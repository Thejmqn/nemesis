import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = 'http://localhost:8000/api'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [userId, setUserId] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(parseInt(storedUserId))
      fetchUser(parseInt(storedUserId))
    }
  }, [])

  const fetchUser = async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/users/${id}`)
      setUser(response.data)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎯 Nemesis</h1>
        <p className="tagline">Find Your Perfect Enemy Match</p>
        {user && (
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <button onClick={() => {
              localStorage.removeItem('userId')
              setUserId(null)
              setUser(null)
              setCurrentView('home')
            }} className="btn btn-secondary" style={{ marginLeft: '10px', padding: '6px 12px' }}>
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="container">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {!userId ? (
          <>
            {currentView === 'home' && (
              <HomeView 
                onRegister={() => setCurrentView('register')}
                onLogin={() => setCurrentView('login')}
              />
            )}
            {currentView === 'register' && (
              <RegisterView
                setUserId={setUserId}
                setUser={setUser}
                setError={setError}
                setSuccess={setSuccess}
                setCurrentView={setCurrentView}
                onBack={() => { setCurrentView('home'); clearMessages() }}
              />
            )}
            {currentView === 'login' && (
              <LoginView
                setUserId={setUserId}
                setUser={setUser}
                setError={setError}
                setSuccess={setSuccess}
                onBack={() => { setCurrentView('home'); clearMessages() }}
              />
            )}
          </>
        ) : (
          <>
            <nav className="nav-tabs">
              <button 
                className={currentView === 'survey' ? 'active' : ''}
                onClick={() => { setCurrentView('survey'); clearMessages() }}
              >
                Answer Questions
              </button>
              <button 
                className={currentView === 'matches' ? 'active' : ''}
                onClick={() => { setCurrentView('matches'); clearMessages() }}
              >
                My Enemies
              </button>
            </nav>

            {currentView === 'survey' && (
              <SurveyView 
                userId={userId}
                setError={setError}
                setSuccess={setSuccess}
              />
            )}

            {currentView === 'matches' && (
              <MatchesView 
                userId={userId}
                setError={setError}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function HomeView({ onRegister, onLogin }) {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <h1 className="landing-title">🎯 NEMESIS</h1>
        <p className="landing-quote">"Keep your friends close and your enemies closer"</p>
        <p className="landing-subtitle">— Sun Tzu, The Art of War</p>
      </div>

      <div className="landing-content">
        <div className="landing-section">
          <h2>⚔️ Know Your Enemy</h2>
          <p>
            In a world where everyone tries to find friends, we take a different approach. 
            Nemesis matches you with your perfect enemy based on your answers to controversial questions.
          </p>
        </div>

        <div className="landing-section">
          <h2>🔥 The More You Disagree, The Better</h2>
          <p>
            Answer thought-provoking questions on topics that divide opinions. The greater the difference 
            in your answers, the higher your incompatibility score. Find someone who challenges your 
            every belief—your perfect nemesis.
          </p>
        </div>

        <div className="landing-section">
          <h2>🌙 Monthly Matches</h2>
          <p>
            Each month, our algorithm analyzes all responses and pairs you with your new enemy. 
            Receive email notifications when your match is ready. Stay vigilant—your nemesis awaits.
          </p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">💀</div>
            <h3>Villain Matching</h3>
            <p>Find your arch-nemesis through algorithmic incompatibility</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Controversial Questions</h3>
            <p>Answer divisive questions that reveal your true nature</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎭</div>
            <h3>Monthly Updates</h3>
            <p>New enemies await you every month</p>
          </div>
        </div>

        <div className="landing-cta">
          <h2>Ready to Meet Your Nemesis?</h2>
          <p>Join the dark side and discover who your perfect enemy is</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
            <button className="btn btn-primary" onClick={onRegister}>
              Begin Your Journey
            </button>
            <button className="btn btn-secondary" onClick={onLogin}>
              Return to Darkness
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RegisterView({ setUserId, setUser, setError, setSuccess, onBack, setCurrentView }) {
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
      const response = await axios.post(`${API_BASE}/users/`, formData)
      setSuccess('Account created successfully! Please answer the questions to get started.')
      localStorage.setItem('userId', response.data.id)
      setUserId(response.data.id)
      setUser(response.data)
      // Redirect to survey after registration
      setTimeout(() => {
        setCurrentView('survey')
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
          <button type="button" className="btn btn-secondary" onClick={onBack}>Back</button>
        </div>
      </form>
    </div>
  )
}

function LoginView({ setUserId, setUser, setError, setSuccess, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      // For simplicity, we'll just get users and find by email
      // In production, you'd have a proper login endpoint
      const response = await axios.get(`${API_BASE}/users/`)
      const user = response.data.find(u => u.email === email)
      
      if (user) {
        // In production, verify password here
        setSuccess('Logged in successfully!')
        localStorage.setItem('userId', user.id)
        setUserId(user.id)
        setUser(user)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('User not found')
      }
    } catch (err) {
      setError('Failed to login')
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
          <button type="button" className="btn btn-secondary" onClick={onBack}>Back</button>
        </div>
      </form>
    </div>
  )
}

function SurveyView({ userId, setError, setSuccess }) {
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
      const response = await axios.get(`${API_BASE}/questions/?active_only=true`)
      setQuestions(response.data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load questions')
      setLoading(false)
    }
  }

  const fetchUserAnswers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/answers/user/${userId}`)
      const answerMap = {}
      const answeredIds = new Set()
      response.data.forEach(ans => {
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
      await axios.post(`${API_BASE}/answers/survey/${userId}`, { answers: answerList })
      setSuccess('Answers saved successfully!')
      // Refresh answered questions
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

function MatchesView({ userId, setError }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API_BASE}/matches/user/${userId}`)
      setMatches(response.data)
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
