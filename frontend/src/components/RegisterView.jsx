import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, getApiErrorMessage, usersAPI } from '../services/api'

export default function RegisterView({ setUser, setError, setSuccess, clearMessages }) {
  const navigate = useNavigate()
  const successTimerRef = useRef(null)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
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
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      password: formData.password
    }
  }, [formData.email, formData.firstName, formData.lastName, formData.password])

  const validate = () => {
    const nextErrors = {}
    if (!trimmedFormData.email) nextErrors.email = 'Email is required.'
    if (!trimmedFormData.firstName) nextErrors.firstName = 'First name is required.'
    if (!trimmedFormData.lastName) nextErrors.lastName = 'Last name is required.'
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
      await usersAPI.create({
        email: trimmedFormData.email,
        password: trimmedFormData.password,
        first_name: trimmedFormData.firstName,
        last_name: trimmedFormData.lastName,
      })

      try {
        const tokenData = await authAPI.login(trimmedFormData.email, trimmedFormData.password)
        if (!tokenData?.access_token) throw new Error('Invalid response from server')

        localStorage.setItem('access_token', tokenData.access_token)
        const userData = await authAPI.getCurrentUser()
        setUser?.(userData)

        setSuccess('Account created successfully! You are now signed in.')
        successTimerRef.current = setTimeout(() => {
          navigate('/survey', { replace: true })
          setSuccess('')
        }, 1000)
      } catch (loginErr) {
        console.error('Auto-login failed:', loginErr)
        localStorage.removeItem('access_token')
        setSuccess('Account created successfully! Please log in to continue.')
        successTimerRef.current = setTimeout(() => {
          navigate('/login', { replace: true })
          setSuccess('')
        }, 1500)
      }
    } catch (err) {
      const detail = getApiErrorMessage(err, 'Failed to create account')
      const nextErrors = {}

      if (detail === 'Email already registered') nextErrors.email = 'That email is already registered. Try logging in instead.'
      if (detail === 'First name is required') nextErrors.firstName = 'First name is required.'
      if (detail === 'Last name is required') nextErrors.lastName = 'Last name is required.'

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

        <label htmlFor="register-first-name">First Name</label>
        <input
          id="register-first-name"
          type="text"
          value={formData.firstName}
          onChange={(e) => {
            setFormData({ ...formData, firstName: e.target.value })
            setFieldErrors((prev) => (prev.firstName ? { ...prev, firstName: '' } : prev))
          }}
          required
          disabled={submitting}
          autoComplete="given-name"
          aria-invalid={Boolean(fieldErrors.firstName)}
          className={fieldErrors.firstName ? 'input-error' : ''}
        />
        {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}

        <label htmlFor="register-last-name">Last Name</label>
        <input
          id="register-last-name"
          type="text"
          value={formData.lastName}
          onChange={(e) => {
            setFormData({ ...formData, lastName: e.target.value })
            setFieldErrors((prev) => (prev.lastName ? { ...prev, lastName: '' } : prev))
          }}
          required
          disabled={submitting}
          autoComplete="family-name"
          aria-invalid={Boolean(fieldErrors.lastName)}
          className={fieldErrors.lastName ? 'input-error' : ''}
        />
        {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}

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
