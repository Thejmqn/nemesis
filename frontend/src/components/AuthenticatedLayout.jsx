import { useNavigate, useLocation } from 'react-router-dom'

export default function AuthenticatedLayout({ user, onLogout, clearMessages, children }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <nav className="nav-tabs">
          <button 
            className={location.pathname === '/home' ? 'active' : ''}
            onClick={() => { navigate('/home'); clearMessages() }}
          >
            Home
          </button>
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
