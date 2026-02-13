import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, user, loading }) {
  if (loading) {
    return <div className="app"><div className="container"><div className="card loading">Loading...</div></div></div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}
