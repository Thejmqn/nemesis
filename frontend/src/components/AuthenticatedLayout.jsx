import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function AuthenticatedLayout({ user, onLogout, clearMessages, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMenuOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  const displayName = useMemo(() => {
    return [user?.first_name, user?.last_name].filter(Boolean).join(' ')
      || user?.username
      || user?.email
      || 'there'
  }, [user?.email, user?.first_name, user?.last_name, user?.username])

  const pageTitle = useMemo(() => {
    if (location.pathname === '/survey') return 'Answer Questions'
    if (location.pathname === '/matches') return 'My Enemies'
    return 'Nemesis'
  }, [location.pathname])

  const goTo = (path) => {
    setIsMenuOpen(false)
    clearMessages?.()
    navigate(path)
  }

  const handleLogoutClick = () => {
    setIsMenuOpen(false)
    onLogout?.()
  }

  return (
    <>
      <div className="app-topbar">
        <div className="app-topbar-title">{pageTitle}</div>
        <button
          type="button"
          className="app-menu-button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
          aria-controls="app-menu-drawer"
          aria-expanded={isMenuOpen}
        >
          <span className="app-menu-icon" aria-hidden="true" />
        </button>
      </div>
      {children}

      <div
        className={`app-menu-overlay ${isMenuOpen ? 'is-open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        role="presentation"
      >
        <div
          id="app-menu-drawer"
          className="app-menu-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="app-menu-header">
            <div className="app-menu-user">Signed in as {displayName}</div>
            <button
              type="button"
              className="app-menu-close"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              Close
            </button>
          </div>

          <button
            type="button"
            className={`app-menu-item ${location.pathname === '/survey' ? 'is-active' : ''}`}
            onClick={() => goTo('/survey')}
          >
            Answer Questions
          </button>
          <button
            type="button"
            className={`app-menu-item ${location.pathname === '/matches' ? 'is-active' : ''}`}
            onClick={() => goTo('/matches')}
          >
            My Enemies
          </button>

          <div className="app-menu-separator" />

          <button
            type="button"
            className="app-menu-item app-menu-item--danger"
            onClick={handleLogoutClick}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  )
}
