'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

function getGradeColor(grade: number) {
  if (grade >= 90) return 'grade-elite'
  if (grade >= 80) return 'grade-high'
  if (grade >= 70) return 'grade-mid'
  if (grade >= 60) return 'grade-low'
  return 'grade-vlow'
}

function getGradeLabel(grade: number) {
  if (grade >= 90) return 'Elite'
  if (grade >= 80) return 'High'
  if (grade >= 70) return 'Mid'
  if (grade >= 60) return 'Low'
  return 'V.Low'
}

function GradeBadge({ grade, label }: { grade: number | null | undefined, label?: string }) {
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
  
  const colorClass = getGradeColor(gradeNum)
  const gradeLabel = getGradeLabel(gradeNum)
  
  return (
    <span className={`grade-badge ${colorClass}`}>
      {gradeNum.toFixed(1)}
      <span className="grade-label">{label || gradeLabel}</span>
    </span>
  )
}

export default function HomePage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [roundFilter, setRoundFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [sortColumn, setSortColumn] = useState<string>('rank')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [votedPlayers, setVotedPlayers] = useState<Set<number>>(new Set())
  const itemsPerPage = 50

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, positionFilter, schoolFilter, roundFilter, gradeFilter])

  useEffect(() => {
    fetch(`${API_URL}/api/players`)
      .then(res => res.json())
      .then(data => {
        setPlayers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load players:', err)
        setPlayers([])
        setLoading(false)
      })
  }, [])

  // Get unique schools for filter
  const schools = useMemo(() => {
    if (!Array.isArray(players)) return []
    const uniqueSchools = Array.from(new Set(players.map(p => p.school))).sort()
    return uniqueSchools
  }, [players])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handlePlayerVote = async (playerId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/player-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId })
      })

      const result = await res.json()
      
      if (res.ok) {
        // Update local voted state
        const newVoted = new Set(votedPlayers)
        if (result.action === 'added') {
          newVoted.add(playerId)
        } else {
          newVoted.delete(playerId)
        }
        setVotedPlayers(newVoted)

        // Reload players to get updated counts
        const updated = await fetch(`${API_URL}/api/players`).then(r => r.json())
        setPlayers(Array.isArray(updated) ? updated : [])
      } else {
        alert(result.error || 'Vote failed')
      }
    } catch (err) {
      alert('Failed to submit vote')
    }
  }

  const filteredPlayers = (Array.isArray(players) ? players : []).filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(search.toLowerCase()) ||
                         player.school.toLowerCase().includes(search.toLowerCase())
    
    // Position filter with groupings
    let matchesPosition = positionFilter === 'all'
    if (!matchesPosition) {
      if (positionFilter === 'EDGE') {
        matchesPosition = ['DE', 'ED', 'OLB'].includes(player.position)
      } else if (positionFilter === 'DL') {
        matchesPosition = ['DT', 'NT'].includes(player.position)
      } else if (positionFilter === 'IOL') {
        matchesPosition = ['G', 'OG', 'C'].includes(player.position)
      } else if (positionFilter === 'S') {
        matchesPosition = player.position === 'SAF'
      } else {
        matchesPosition = player.position === positionFilter
      }
    }
    
    const matchesSchool = schoolFilter === 'all' || player.school === schoolFilter
    const matchesRound = roundFilter === 'all' || player.projected_round?.toString() === roundFilter
    
    // Grade filter
    let matchesGrade = true
    if (gradeFilter !== 'all') {
      const grade = typeof player.consensus_grade === 'number' ? player.consensus_grade : parseFloat(player.consensus_grade)
      if (gradeFilter === 'elite' && grade < 90) matchesGrade = false
      if (gradeFilter === 'high' && (grade < 80 || grade >= 90)) matchesGrade = false
      if (gradeFilter === 'mid' && (grade < 70 || grade >= 80)) matchesGrade = false
      if (gradeFilter === 'low' && grade >= 70) matchesGrade = false
    }
    
    return matchesSearch && matchesPosition && matchesSchool && matchesRound && matchesGrade
  })

  // Sort filtered players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let aVal, bVal
    
    switch (sortColumn) {
      case 'rank':
        aVal = a.rank
        bVal = b.rank
        break
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'position':
        aVal = a.position
        bVal = b.position
        break
      case 'school':
        aVal = a.school.toLowerCase()
        bVal = b.school.toLowerCase()
        break
      case 'height':
        // Parse height like "6-5" to numeric for comparison
        aVal = a.height ? parseInt(a.height.split('-')[0]) * 12 + parseInt(a.height.split('-')[1]) : 0
        bVal = b.height ? parseInt(b.height.split('-')[0]) * 12 + parseInt(b.height.split('-')[1]) : 0
        break
      case 'weight':
        aVal = parseInt(a.weight) || 0
        bVal = parseInt(b.weight) || 0
        break
      case 'pff_grade':
        aVal = a.pff_grade || 0
        bVal = b.pff_grade || 0
        break
      case 'scout_grade':
        aVal = a.scout_grade || 0
        bVal = b.scout_grade || 0
        break
      case 'community_score':
        aVal = a.community_score || 0
        bVal = b.community_score || 0
        break
      default:
        return 0
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Paginate sorted players
  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPlayers = sortedPlayers.slice(startIndex, startIndex + itemsPerPage)

  const clearFilters = () => {
    setSearch('')
    setPositionFilter('all')
    setSchoolFilter('all')
    setRoundFilter('all')
    setGradeFilter('all')
    setSortColumn('rank')
    setSortDirection('asc')
    setCurrentPage(1)
  }

  const activeFiltersCount = [positionFilter, schoolFilter, roundFilter, gradeFilter].filter(f => f !== 'all').length

  if (!mounted || loading) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <p>Loading prospects...</p>
      </div>
    )
  }

  return (
    <>
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="filters-section">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search players or schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-grid">
            <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
              <option value="all">All Positions</option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="WR">WR</option>
              <option value="TE">TE</option>
              <option value="OT">OT</option>
              <option value="IOL">IOL</option>
              <option value="EDGE">EDGE</option>
              <option value="DL">DL</option>
              <option value="LB">LB</option>
              <option value="CB">CB</option>
              <option value="S">S</option>
            </select>

            <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
              <option value="all">All Schools</option>
              {schools.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>

            <select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
              <option value="all">All Rounds</option>
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Round 3</option>
              <option value="4-7">Round 4-7</option>
            </select>

            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="all">All Grades</option>
              <option value="elite">Elite (90+)</option>
              <option value="high">High (80-89)</option>
              <option value="mid">Mid (70-79)</option>
              <option value="low">Low (&lt;70)</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <div className="active-filters">
              <span className="filter-count">{activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active</span>
              <button onClick={clearFilters} className="clear-filters">Clear all</button>
            </div>
          )}
        </div>

        <div className="results-count">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedPlayers.length)} of {sortedPlayers.length} prospects
          {sortedPlayers.length !== players.length && ` (filtered from ${players.length})`}
        </div>

        {/* Desktop Table View */}
        <table className="desktop-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('rank')} className="sortable">
                Rank {sortColumn === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                Player {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('position')} className="sortable">
                Position {sortColumn === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('school')} className="sortable">
                School {sortColumn === 'school' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('height')} className="sortable">
                Height {sortColumn === 'height' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('weight')} className="sortable">
                Weight {sortColumn === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('pff_grade')} className="sortable">
                PFF Grade {sortColumn === 'pff_grade' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('scout_grade')} className="sortable">
                Scout Grade {sortColumn === 'scout_grade' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('community_score')} className="sortable">
                Community {sortColumn === 'community_score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedPlayers.map(player => (
              <tr key={player.id}>
                <td>{player.rank}</td>
                <td>
                  <Link href={`/player/${player.slug}`} className="player-link">
                    {player.name}
                  </Link>
                </td>
                <td>{player.position}</td>
                <td>{player.school}</td>
                <td>{player.height}</td>
                <td>{player.weight}</td>
                <td><GradeBadge grade={player.pff_grade} label={player.pff_grade ? undefined : 'N/A'} /></td>
                <td><GradeBadge grade={player.scout_grade} /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handlePlayerVote(player.id)}
                      className={`vote-btn ${votedPlayers.has(player.id) ? 'voted' : ''}`}
                      title={votedPlayers.has(player.id) ? 'Remove vote' : 'Upvote'}
                      style={{ 
                        fontSize: '18px',
                        padding: '4px 8px',
                        background: votedPlayers.has(player.id) ? '#22c55e' : 'transparent'
                      }}
                    >
                      👍
                    </button>
                    <span style={{ fontWeight: '600', color: '#22c55e' }}>
                      {player.community_score || 0}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="mobile-cards">
          {paginatedPlayers.map(player => (
            <Link href={`/player/${player.slug}`} key={player.id} className="player-card">
              <div className="card-header">
                <div className="card-rank">#{player.rank}</div>
                <div className="card-position">{player.position}</div>
              </div>
              <h3 className="card-name">{player.name}</h3>
              <div className="card-school">{player.school}</div>
              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">Height</span>
                  <span className="stat-value">{player.height}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Weight</span>
                  <span className="stat-value">{player.weight} lbs</span>
                </div>
                <div className="stat">
                  <span className="stat-label">PFF Grade</span>
                  <GradeBadge grade={player.pff_grade} label={player.pff_grade ? undefined : 'N/A'} />
                </div>
                <div className="stat">
                  <span className="stat-label">Scout Grade</span>
                  <GradeBadge grade={player.scout_grade} />
                </div>
                <div className="stat">
                  <span className="stat-label">Community</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handlePlayerVote(player.id)
                      }}
                      className={`vote-btn ${votedPlayers.has(player.id) ? 'voted' : ''}`}
                      style={{ 
                        fontSize: '16px',
                        padding: '2px 6px',
                        background: votedPlayers.has(player.id) ? '#22c55e' : 'transparent'
                      }}
                    >
                      👍
                    </button>
                    <span style={{ fontWeight: '600', color: '#22c55e' }}>
                      {player.community_score || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
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
    </>
  )
}
