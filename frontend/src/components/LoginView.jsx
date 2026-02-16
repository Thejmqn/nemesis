import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, getApiErrorMessage } from '../services/api'

export default function LoginView({ setUser, setError, setSuccess, clearMessages }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [uiError, setUiError] = useState('') // local UI error for on-page display

  useEffect(() => {
    // Only clear messages on mount, not on every render
    clearMessages?.()
    setUiError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only runs on mount

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return
    setLoading(true)

    // Clear any existing messages
    setError('')
    setSuccess('')
    setUiError('')

    try {
      const tokenData = await authAPI.login(email, password)

      if (tokenData && tokenData.access_token) {
        localStorage.setItem('access_token', tokenData.access_token)

        try {
          const userData = await authAPI.getCurrentUser()
          setUser(userData)
          setSuccess('Logged in successfully!')
          setTimeout(() => {
            navigate('/home', { replace: true })
            setSuccess('')
          }, 1000)
        } catch (userErr) {
          console.error('Error fetching user:', userErr)
          localStorage.removeItem('access_token')
          setUser(null)
          const msg = 'Failed to authenticate. Please try again.'
          setError(msg)
          setUiError(msg)
          setTimeout(() => {
            setError('')
            setUiError('')
          }, 4000)
        }
      } else {
        setUser(null)
        const msg = 'Invalid response from server'
        setError(msg)
        setUiError(msg)
        setTimeout(() => {
          setError('')
          setUiError('')
        }, 4000)
      }
    } catch (err) {
      console.error('Login error caught:', err)
      const msg = err.response?.status === 401
        ? 'Incorrect email or password'
        : getApiErrorMessage(err, 'Failed to log in')
      setError(msg)
      setUiError(msg)
      localStorage.removeItem('access_token')
      setUser(null)
      setTimeout(() => {
        setError('')
        setUiError('')
      }, 4000)
    } finally {
      setLoading(false)
    }
  }

  const onEmailChange = (e) => {
    setEmail(e.target.value)
    if (uiError) setUiError('') // clear UI error when user edits the field
  }

  const onPasswordChange = (e) => {
    setPassword(e.target.value)
    if (uiError) setUiError('') // clear UI error when user edits the field
  }

  return (
    <div className="card">
      <h2>Login</h2>

      {/* Visible UI error banner */}
      {/* {uiError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '6px',
            color: '#842029',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c2c7',
            fontSize: '14px'
          }}
        >
          {uiError}
        </div>
      )} */}

      <form onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={onEmailChange}
          required
          disabled={loading}
          autoComplete="username"
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={onPasswordChange}
          required
          disabled={loading}
          autoComplete="current-password"
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              navigate('/')
              clearMessages?.()
              setUiError('')
            }}
            disabled={loading}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  )
}
