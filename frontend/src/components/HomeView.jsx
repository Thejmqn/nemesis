import { useNavigate } from 'react-router-dom'

export default function HomeView() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <h1 className="landing-title">Nemesis</h1>
        <p className="landing-quote">Keep your friends close and your enemies closer.</p>
      </div>

      <div className="landing-content">
        <p className="landing-description">
          Answer controversial questions. We'll find your perfect enemy.
        </p>
        <p className="landing-subtext">
          The more you disagree, the more hatred you'll have.
        </p>
      </div>

      <div className="landing-cta">
        <button className="btn btn-primary" onClick={() => navigate('/register')}>
          Begin
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/login')}>
          Return
        </button>
      </div>
    </div>
  )
}
