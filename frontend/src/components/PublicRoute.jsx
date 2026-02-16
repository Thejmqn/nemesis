import { Navigate, useLocation } from 'react-router-dom'

export default function PublicRoute({ children, user, loading }) {
  const location = useLocation()
  
  if (loading) {
    return <div className="app"><div className="container"><div className="card loading">Loading...</div></div></div>
  }
  if (user && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/home" replace />
  }
  return children
}
