import { useState, useEffect } from 'react'
import { matchesAPI } from '../services/api'

export default function MatchesView({ setError }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const matchesData = await matchesAPI.getUserMatches()
      setMatches(matchesData)
      setLoading(false)
    } catch (err) {
      setError('Failed to load matches')
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="card loading">Loading matches...</div>
  }

  return (
    <div className="card">
      <h2>My Enemy Matches</h2>
      <p style={{ marginBottom: '20px', color: '#b0b0b0' }}>
        Your matches are generated automatically by administrators. New matches appear here after each monthly matching cycle.
      </p>
      {matches.length === 0 ? (
        <p>No matches yet. Complete the survey and wait for the next matching cycle!</p>
      ) : (
        <div className="matches-list">
          {matches.map(match => (
            <div key={match.id} className="match-item">
              <h3>Enemy: {match.enemy_username}</h3>
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
