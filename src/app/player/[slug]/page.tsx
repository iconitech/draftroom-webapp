'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

// PFF Grade color coding (0-100 scale)
function getPFFGradeColor(grade: number) {
  if (grade >= 90) return 'grade-elite'
  if (grade >= 80) return 'grade-high'
  if (grade >= 70) return 'grade-mid'
  if (grade >= 60) return 'grade-low'
  return 'grade-vlow'
}

function getPFFGradeLabel(grade: number) {
  if (grade >= 90) return 'Elite'
  if (grade >= 80) return 'High'
  if (grade >= 70) return 'Mid'
  if (grade >= 60) return 'Low'
  return 'V.Low'
}

// Scout Grade color coding (1-9 scale)
function getScoutGradeColor(grade: number) {
  if (grade >= 8.5) return 'grade-elite'      // 9.0 = Elite
  if (grade >= 7.5) return 'grade-high'       // 8.0 = Outstanding
  if (grade >= 6.75) return 'grade-mid'       // 7.0-7.5 = Very Good
  if (grade >= 5.75) return 'grade-low'       // 6.0-6.5 = Good/Adequate
  if (grade >= 4.75) return 'grade-vlow'      // 5.0-5.5 = Below Average/Marginal
  return 'grade-vlow'                         // <5.0 = Poor/Replaceable
}

function getScoutGradeLabel(grade: number) {
  if (grade >= 8.5) return 'Elite'
  if (grade >= 7.5) return 'Outstanding'
  if (grade >= 6.75) return 'Very Good'
  if (grade >= 6.25) return 'Good'
  if (grade >= 5.75) return 'Adequate'
  if (grade >= 5.25) return 'Marginal'
  if (grade >= 4.75) return 'Below Avg'
  if (grade >= 4.25) return 'Poor'
  return 'Replaceable'
}

function GradeBadge({ grade, label, type = 'pff' }: { grade: number | null | undefined, label?: string, type?: 'pff' | 'scout' }) {
  // Handle null/undefined/NaN grades
  if (!grade || isNaN(grade)) {
    return (
      <span className="grade-badge grade-tbd">
        TBD
        <span className="grade-label">{label || 'Pending'}</span>
      </span>
    )
  }
  
  const gradeNum = typeof grade === 'number' ? grade : parseFloat(grade)
  if (isNaN(gradeNum)) {
    return (
      <span className="grade-badge grade-tbd">
        TBD
        <span className="grade-label">{label || 'Pending'}</span>
      </span>
    )
  }
  
  // Use different color/label functions based on type
  const colorClass = type === 'scout' ? getScoutGradeColor(gradeNum) : getPFFGradeColor(gradeNum)
  const gradeLabel = type === 'scout' ? getScoutGradeLabel(gradeNum) : getPFFGradeLabel(gradeNum)
  
  return (
    <span className={`grade-badge ${colorClass}`}>
      {gradeNum.toFixed(1)}
      <span className="grade-label">{label || gradeLabel}</span>
    </span>
  )
}

export default function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newReport, setNewReport] = useState({ display_name: '', email: '', content: '', honeypot: '' })
  const [sortBy, setSortBy] = useState('top')
  const [submitting, setSubmitting] = useState(false)
  const [formLoadTime, setFormLoadTime] = useState<number>(0)
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [password, setPassword] = useState('')
  const [editData, setEditData] = useState<any>(null)

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    setFormLoadTime(Date.now())
  }, [])

  useEffect(() => {
    if (!slug) return

    fetch(`${API_URL}/api/players/${slug}`)
      .then(res => res.json())
      .then(data => {
        setPlayerData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load player:', err)
        setLoading(false)
      })
  }, [slug])

  const handleVote = async (reportId: number, voteType: 'up' | 'down') => {
    try {
      const res = await fetch(`${API_URL}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, vote_type: voteType })
      })

      const result = await res.json()
      
      if (res.ok) {
        // Reload player data to get updated scores
        const updated = await fetch(`${API_URL}/api/players/${slug}`).then(r => r.json())
        setPlayerData(updated)
      } else {
        alert(result.error || 'Vote failed')
      }
    } catch (err) {
      alert('Failed to submit vote')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerData.player.id,
          display_name: newReport.display_name,
          email: newReport.email,
          content: newReport.content,
          honeypot: newReport.honeypot,
          submit_time: formLoadTime
        })
      })

      const result = await res.json()

      if (res.ok) {
        alert('Report submitted successfully!')
        setNewReport({ display_name: '', email: '', content: '', honeypot: '' })
        
        // Reload player data to show new report
        const updated = await fetch(`${API_URL}/api/players/${slug}`).then(r => r.json())
        setPlayerData(updated)
      } else {
        alert(result.error || 'Failed to submit report')
      }
    } catch (err) {
      alert('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = () => {
    setShowPasswordPrompt(true)
  }

  const handlePasswordSubmit = () => {
    if (!password) {
      alert('Please enter a password')
      return
    }

    // Initialize edit data with current expert report
    setEditData({
      player_id: playerData.player.id,
      summary: playerData.expertReport?.summary || '',
      strengths: playerData.expertReport?.strengths || '',
      weaknesses: playerData.expertReport?.weaknesses || '',
      scheme_fit: playerData.expertReport?.scheme_fit || '',
      nfl_comp: playerData.expertReport?.nfl_comp || '',
      floor: playerData.expertReport?.floor || '',
      ceiling: playerData.expertReport?.ceiling || '',
      risk: playerData.expertReport?.risk || ''
    })

    setIsEditing(true)
    setShowPasswordPrompt(false)
  }

  const handleSaveEdit = async () => {
    if (!editData) return

    try {
      const res = await fetch(`${API_URL}/api/admin/expert-report`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify(editData)
      })

      const result = await res.json()

      if (res.ok) {
        alert('Expert report updated successfully!')
        setIsEditing(false)
        setPassword('')
        
        // Reload player data
        const updated = await fetch(`${API_URL}/api/players/${slug}`).then(r => r.json())
        setPlayerData(updated)
      } else {
        alert(result.error || 'Failed to update report')
      }
    } catch (err) {
      alert('Failed to update report')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData(null)
    setPassword('')
  }

  if (!slug || loading) {
    return <div className="container" style={{ paddingTop: '40px' }}>Loading...</div>
  }

  if (!playerData || !playerData.player) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <h1>Player not found</h1>
        <Link href="/" className="player-link">← Back to all prospects</Link>
      </div>
    )
  }

  const { player, expertReport, communityReports } = playerData

  const sortedReports = [...communityReports].sort((a: any, b: any) => {
    if (sortBy === 'top') return b.score - a.score
    if (sortBy === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    // Controversial = most votes
    return (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes)
  })

  return (
    <div style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="container">
        <Link href="/" className="player-link">← Back to all prospects</Link>
        
        <div className="player-header" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            {player.school_logo && (
              <img src={player.school_logo} alt={player.school} style={{ width: '48px', height: '48px' }} />
            )}
            <h1 style={{ margin: 0 }}>{player.name}</h1>
          </div>
          <div className="player-meta">
            {player.position} • {player.school} • {player.height} / {player.weight} lbs
          </div>
          <div className="player-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              PFF Grade: <GradeBadge grade={player.pff_grade} label={player.pff_grade ? undefined : 'N/A'} type="pff" />
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Scout Grade: <GradeBadge grade={player.scout_grade} type="scout" />
            </span>
          </div>
        </div>

        <div className="expert-report">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>Expert Scouting Report</h2>
              {!isEditing && (
                <button onClick={handleEditClick} className="edit-btn" title="Edit report">
                  ✏️ Edit
                </button>
              )}
            </div>

            {!isEditing ? (
              <>
                {expertReport ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <strong>Summary:</strong> {expertReport.summary}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Strengths:</strong> {expertReport.strengths}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Weaknesses:</strong> {expertReport.weaknesses}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Scheme Fit:</strong> {expertReport.scheme_fit}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>NFL Comparison:</strong> {expertReport.nfl_comp}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Floor:</strong> {expertReport.floor}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Ceiling:</strong> {expertReport.ceiling}
                    </div>
                    <div>
                      <strong>Risk Profile:</strong> {expertReport.risk}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#78350f' }}>
                    <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                      📋 Scouting Report In Progress
                    </p>
                    <p style={{ fontSize: '14px', opacity: '0.9' }}>
                      Our scouts are currently evaluating this prospect. Full breakdown coming soon.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="edit-form">
                <div style={{ marginBottom: '16px' }}>
                  <label><strong>Summary:</strong></label>
                  <textarea
                    value={editData.summary}
                    onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                    rows={4}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label><strong>Strengths:</strong></label>
                  <textarea
                    value={editData.strengths}
                    onChange={(e) => setEditData({ ...editData, strengths: e.target.value })}
                    rows={3}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label><strong>Weaknesses:</strong></label>
                  <textarea
                    value={editData.weaknesses}
                    onChange={(e) => setEditData({ ...editData, weaknesses: e.target.value })}
                    rows={3}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label><strong>Scheme Fit:</strong></label>
                  <textarea
                    value={editData.scheme_fit}
                    onChange={(e) => setEditData({ ...editData, scheme_fit: e.target.value })}
                    rows={2}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label><strong>NFL Comparison:</strong></label>
                  <input
                    type="text"
                    value={editData.nfl_comp}
                    onChange={(e) => setEditData({ ...editData, nfl_comp: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label><strong>Floor:</strong></label>
                  <input
                    type="text"
                    value={editData.floor}
                    onChange={(e) => setEditData({ ...editData, floor: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label><strong>Ceiling:</strong></label>
                  <input
                    type="text"
                    value={editData.ceiling}
                    onChange={(e) => setEditData({ ...editData, ceiling: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label><strong>Risk Profile:</strong></label>
                  <input
                    type="text"
                    value={editData.risk}
                    onChange={(e) => setEditData({ ...editData, risk: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleSaveEdit} className="submit-btn">
                    💾 Save Changes
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-btn">
                    ✖ Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        {/* Password prompt modal */}
        {showPasswordPrompt && (
          <div className="modal-overlay" onClick={() => setShowPasswordPrompt(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Enter Admin Password</h3>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button onClick={handlePasswordSubmit} className="submit-btn">
                  Unlock
                </button>
                <button onClick={() => setShowPasswordPrompt(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="community-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Community Scouting Reports ({communityReports.length})</h2>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="top">Top</option>
              <option value="new">New</option>
              <option value="controversial">Controversial</option>
            </select>
          </div>

          {sortedReports.map((report: any) => (
            <div key={report.id} className="report-card">
              <div style={{ marginBottom: '8px' }}>
                <strong>{report.display_name || 'Anonymous Scout'}</strong>
                <span style={{ color: '#999', fontSize: '14px', marginLeft: '12px' }}>
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <p>{report.content}</p>
              <div className="vote-controls">
                <button 
                  className="vote-btn" 
                  onClick={() => handleVote(report.id, 'up')}
                >
                  ▲
                </button>
                <span className="score">{report.score}</span>
                <button 
                  className="vote-btn" 
                  onClick={() => handleVote(report.id, 'down')}
                >
                  ▼
                </button>
                <span style={{ color: '#999', fontSize: '14px', marginLeft: 'auto' }}>
                  {report.upvotes} up • {report.downvotes} down
                </span>
              </div>
            </div>
          ))}

          {communityReports.length === 0 && (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No community reports yet. Be the first to scout this prospect!
            </p>
          )}

          <div className="submit-form">
            <h3>Submit Your Scouting Report</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your name *"
                value={newReport.display_name}
                onChange={(e) => setNewReport({ ...newReport, display_name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Your email *"
                value={newReport.email}
                onChange={(e) => setNewReport({ ...newReport, email: e.target.value })}
                required
              />
              {/* Honeypot field - hidden from users, bots will fill it */}
              <input
                type="text"
                name="website"
                value={newReport.honeypot}
                onChange={(e) => setNewReport({ ...newReport, honeypot: e.target.value })}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />
              <textarea
                placeholder="Your scouting report (50-2500 characters)..."
                value={newReport.content}
                onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                required
                minLength={50}
                maxLength={2500}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '-8px', marginBottom: '12px' }}>
                {newReport.content.length}/2500 characters • Your email will not be displayed publicly.
              </p>
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>About DraftRoom</h3>
              <p>Community-driven NFL Draft scouting platform featuring expert analysis and community insights. Scout prospects, share your takes, and build your draft board.</p>
            </div>
            <div className="footer-section">
              <h3>Built By</h3>
              <a href="https://x.com/BucsJuice" target="_blank" rel="noopener noreferrer" className="footer-link">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @BucsJuice
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 DraftRoom. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
