'use client'

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

interface Player {
  id: number
  name: string
  position: string
  rank: number
  scout_grade: number | null
  school: string
}

function SortablePlayer({ player }: { player: Player }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="sortable-player"
    >
      <div className="drag-handle">⋮⋮</div>
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <span className="player-meta">{player.school}</span>
      </div>
      <div className="player-grades">
        {player.scout_grade ? (
          <span className="scout-grade">{player.scout_grade.toFixed(1)}</span>
        ) : (
          <span className="no-grade">—</span>
        )}
      </div>
    </div>
  )
}

export default function AdminRankingsPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [selectedPosition, setSelectedPosition] = useState('all')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load players
  useEffect(() => {
    if (authenticated) {
      fetch(`${API_URL}/api/players`)
        .then(res => res.json())
        .then(data => {
          setPlayers(Array.isArray(data) ? data : [])
        })
        .catch(err => {
          console.error('Failed to load players:', err)
          setPlayers([])
        })
    }
  }, [authenticated])

  // Filter players by position
  useEffect(() => {
    let filtered = players

    if (selectedPosition !== 'all') {
      // Handle grouped positions
      if (selectedPosition === 'EDGE') {
        filtered = filtered.filter(p => ['DE', 'ED', 'OLB'].includes(p.position))
      } else if (selectedPosition === 'DL') {
        filtered = filtered.filter(p => ['DT', 'NT'].includes(p.position))
      } else if (selectedPosition === 'IOL') {
        filtered = filtered.filter(p => ['G', 'OG', 'C'].includes(p.position))
      } else if (selectedPosition === 'S') {
        filtered = filtered.filter(p => p.position === 'SAF')
      } else {
        filtered = filtered.filter(p => p.position === selectedPosition)
      }
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.school.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort by current rank
    filtered.sort((a, b) => a.rank - b.rank)

    setFilteredPlayers(filtered)
  }, [players, selectedPosition, searchTerm])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFilteredPlayers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault()
    // Try to authenticate by making a test request
    fetch(`${API_URL}/api/admin/expert-report`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${password}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ player_id: 0, summary: 'test' })
    }).then(res => {
      if (res.status === 401) {
        setMessage('Invalid password')
      } else {
        setAuthenticated(true)
        setMessage('')
      }
    }).catch(() => {
      setMessage('Authentication failed')
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      // Build updates array with new ranks based on order
      const updates = filteredPlayers.map((player, index) => ({
        player_id: player.id,
        rank: index + 1
      }))

      const response = await fetch(`${API_URL}/api/admin/update-ranks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      })

      if (response.ok) {
        setMessage(`✅ Saved ${updates.length} rankings!`)
        // Reload players to get updated ranks
        const data = await fetch(`${API_URL}/api/players`).then(r => r.json())
        setPlayers(Array.isArray(data) ? data : [])
      } else {
        setMessage('❌ Failed to save rankings')
      }
    } catch (error) {
      setMessage('❌ Error saving rankings')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoSort = () => {
    const sorted = [...filteredPlayers].sort((a, b) => {
      // Sort by scout grade (DESC), then by name
      if (a.scout_grade && b.scout_grade) {
        if (b.scout_grade !== a.scout_grade) {
          return b.scout_grade - a.scout_grade
        }
      }
      if (a.scout_grade && !b.scout_grade) return -1
      if (!a.scout_grade && b.scout_grade) return 1
      return a.name.localeCompare(b.name)
    })
    setFilteredPlayers(sorted)
    setMessage('📊 Auto-sorted by scout grade')
  }

  // Get unique positions
  const positions = ['all', 'QB', 'RB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DL', 'LB', 'CB', 'S']

  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>Admin Rankings</h1>
          <p>Enter admin password to manage player rankings</p>
          <form onSubmit={handleAuthenticate}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="password-input"
            />
            <button type="submit" className="login-btn">
              Login
            </button>
          </form>
          {message && <p className="error-message">{message}</p>}
          <Link href="/" className="back-link">← Back to Big Board</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-rankings-page">
      <div className="admin-header">
        <h1>Admin Rankings Manager</h1>
        <Link href="/" className="back-link">← Back to Big Board</Link>
      </div>

      <div className="admin-controls">
        <div className="control-row">
          <div className="filter-group">
            <label>Position:</label>
            <select
              value={selectedPosition}
              onChange={(e) => {
                setSelectedPosition(e.target.value)
                setSearchTerm('')
              }}
              className="position-select"
            >
              <option value="all">All Positions</option>
              {positions.slice(1).map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Player or school..."
              className="search-input-admin"
            />
          </div>
        </div>

        <div className="action-row">
          <button onClick={handleAutoSort} className="auto-sort-btn">
            📊 Auto-sort by Scout Grade
          </button>
          <button onClick={handleSave} disabled={saving} className="save-btn">
            {saving ? 'Saving...' : `💾 Save Rankings (${filteredPlayers.length})`}
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="rankings-info">
        <p>
          <strong>Drag and drop</strong> to reorder players. Rankings will be saved as 1, 2, 3... based on the order.
        </p>
        <p>
          Showing {filteredPlayers.length} players
          {selectedPosition !== 'all' && ` at ${selectedPosition}`}
        </p>
      </div>

      <div className="sortable-list">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredPlayers.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredPlayers.map((player, index) => (
              <div key={player.id} className="sortable-item-wrapper">
                <div className="rank-number">#{index + 1}</div>
                <SortablePlayer player={player} />
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {filteredPlayers.length === 0 && (
        <div className="empty-state">
          <p>No players found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  )
}
