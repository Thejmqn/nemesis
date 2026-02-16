import { useNavigate } from 'react-router-dom'

export default function DashboardView() {
  const navigate = useNavigate()

  return (
    <div className="card">
      <h2>Home</h2>
      <p style={{ marginBottom: '20px', color: '#b0b0b0' }}>
        Jump back into the survey or check your latest enemies.
      </p>

      <div className="dashboard-grid">
        <button type="button" className="dashboard-tile" onClick={() => navigate('/survey')}>
          <div className="dashboard-tile-title">Answer Questions</div>
          <div className="dashboard-tile-subtitle">Continue where you left off</div>
        </button>

        <button type="button" className="dashboard-tile" onClick={() => navigate('/matches')}>
          <div className="dashboard-tile-title">My Enemies</div>
          <div className="dashboard-tile-subtitle">See your incompatibility scores</div>
        </button>
      </div>
    </div>
  )
}

