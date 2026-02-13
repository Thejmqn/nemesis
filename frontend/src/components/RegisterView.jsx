import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage, usersAPI } from '../services/api'

export default function RegisterView({ setError, setSuccess, clearMessages }) {
  const navigate = useNavigate()
  const successTimerRef = useRef(null)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    clearMessages?.()
    setFieldErrors({})
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trimmedFormData = useMemo(() => {
    return {
      email: formData.email.trim(),
      username: formData.username.trim(),
      password: formData.password
    }
  }, [formData.email, formData.username, formData.password])

  const validate = () => {
    const nextErrors = {}
    if (!trimmedFormData.email) nextErrors.email = 'Email is required.'
    if (!trimmedFormData.username) nextErrors.username = 'Username is required.'
    if (!trimmedFormData.password) nextErrors.password = 'Password is required.'
    if (trimmedFormData.password && trimmedFormData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.'
    else if (trimmedFormData.password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setSuccess('')
    setFieldErrors({})

    if (submitting) return

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Please fix the highlighted fields and try again.')
      return
    }

    try {
      setSubmitting(true)
      await usersAPI.create(trimmedFormData)
      setSuccess('Account created successfully! Please log in to continue.')
      successTimerRef.current = setTimeout(() => {
        navigate('/login')
        setSuccess('')
      }, 1500)
    } catch (err) {
      const detail = getApiErrorMessage(err, 'Failed to create account')
      const nextErrors = {}

      if (detail === 'Email already registered') nextErrors.email = 'That email is already registered. Try logging in instead.'
      if (detail === 'Username already taken') nextErrors.username = 'That username is already taken. Try a different one.'

      if (Object.keys(nextErrors).length > 0) setFieldErrors(nextErrors)
      setError(detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value })
            setFieldErrors((prev) => (prev.email ? { ...prev, email: '' } : prev))
          }}
          required
          disabled={submitting}
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          className={fieldErrors.email ? 'input-error' : ''}
        />
        {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}

        <label htmlFor="register-username">Username</label>
        <input
          id="register-username"
          type="text"
          value={formData.username}
          onChange={(e) => {
            setFormData({ ...formData, username: e.target.value })
            setFieldErrors((prev) => (prev.username ? { ...prev, username: '' } : prev))
          }}
          required
          disabled={submitting}
          autoComplete="username"
          aria-invalid={Boolean(fieldErrors.username)}
          className={fieldErrors.username ? 'input-error' : ''}
        />
        {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value })
            setFieldErrors((prev) => (prev.password ? { ...prev, password: '' } : prev))
          }}
          required
          disabled={submitting}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password)}
          className={fieldErrors.password ? 'input-error' : ''}
        />
        <div className="field-hint">At least 8 characters.</div>
        {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}

        <label htmlFor="register-confirm-password">Confirm Password</label>
        <input
          id="register-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            setFieldErrors((prev) => (prev.confirmPassword ? { ...prev, confirmPassword: '' } : prev))
          }}
          required
          disabled={submitting}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          className={fieldErrors.confirmPassword ? 'input-error' : ''}
        />
        {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Account'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { navigate('/'); clearMessages?.() }}
            disabled={submitting}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  )
}
