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
                Take Survey
              </button>
              <button 
                className={currentView === 'matches' ? 'active' : ''}
                onClick={() => { setCurrentView('matches'); clearMessages() }}
              >
                My Enemies
              </button>
              <button 
                className={currentView === 'new-questions' ? 'active' : ''}
                onClick={() => { setCurrentView('new-questions'); clearMessages() }}
              >
                New Questions
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

            {currentView === 'new-questions' && (
              <NewQuestionsView 
                userId={userId}
                setError={setError}
                setSuccess={setSuccess}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function HomeView({ onRegister, onLogin, setUserId, setUser, setError, setSuccess, clearMessages }) {
  return (
    <div className="card">
      <h2>Welcome to Nemesis!</h2>
      <p style={{ marginBottom: '20px', fontSize: '18px' }}>
        Answer controversial questions and get matched with your perfect enemy each month.
        The more you disagree, the better the match!
      </p>
      <div style={{ display: 'flex', gap: '15px' }}>
        <button className="btn btn-primary" onClick={onRegister}>
          Create Account
        </button>
        <button className="btn btn-secondary" onClick={onLogin}>
          Login
        </button>
      </div>
    </div>
  )
}

function RegisterView({ setUserId, setUser, setError, setSuccess, onBack }) {
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
      setSuccess('Account created successfully!')
      localStorage.setItem('userId', response.data.id)
      setUserId(response.data.id)
      setUser(response.data)
      setTimeout(() => setSuccess(''), 3000)
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
      response.data.forEach(ans => {
        answerMap[ans.question_id] = ans.answer_value
      })
      setAnswers(answerMap)
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
      setSuccess('Survey submitted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit survey')
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

  return (
    <div className="card">
      <h2>Controversial Questions Survey</h2>
      <p style={{ marginBottom: '20px' }}>
        Rate each statement from 1 (Strongly Disagree) to 10 (Strongly Agree)
      </p>
      <form onSubmit={handleSubmit}>
        {questions.map(question => (
          <div key={question.id} className="question-item">
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
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={submitting}
          style={{ marginTop: '20px', width: '100%' }}
        >
          {submitting ? 'Submitting...' : 'Submit Survey'}
        </button>
      </form>
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

  const handleFindEnemy = async () => {
    try {
      const response = await axios.post(`${API_BASE}/matches/user/${userId}/find-enemy`)
      setMatches([response.data, ...matches])
      alert(`New enemy found: ${response.data.enemy_username} (Score: ${response.data.match_score})`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to find enemy')
    }
  }

  if (loading) {
    return <div className="card loading">Loading matches...</div>
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Enemy Matches</h2>
        <button className="btn btn-primary" onClick={handleFindEnemy}>
          Find New Enemy
        </button>
      </div>
      {matches.length === 0 ? (
        <p>No matches yet. Complete the survey first, then click "Find New Enemy"!</p>
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

function NewQuestionsView({ userId, setError, setSuccess }) {
  const [questions, setQuestions] = useState([])
  const [newQuestion, setNewQuestion] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/questions/?active_only=false`)
      setQuestions(response.data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load questions')
      setLoading(false)
    }
  }

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    try {
      await axios.post(`${API_BASE}/questions/`, { text: newQuestion })
      setSuccess('Question added successfully!')
      setNewQuestion('')
      fetchQuestions()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to add question')
    }
  }

  if (loading) {
    return <div className="card loading">Loading questions...</div>
  }

  return (
    <div className="card">
      <h2>Add New Controversial Question</h2>
      <form onSubmit={handleSubmitQuestion} style={{ marginBottom: '30px' }}>
        <label>Question Text</label>
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="e.g., Pineapple belongs on pizza"
          required
        />
        <button type="submit" className="btn btn-primary">Add Question</button>
      </form>

      <h3>All Questions</h3>
      <div className="questions-list">
        {questions.map(question => (
          <div key={question.id} className="question-item" style={{ 
            padding: '15px', 
            background: question.is_active ? '#f8f9fa' : '#e9ecef',
            marginBottom: '10px',
            borderRadius: '6px'
          }}>
            <p><strong>{question.text}</strong></p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Status: {question.is_active ? 'Active' : 'Inactive'} | 
              Created: {new Date(question.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
