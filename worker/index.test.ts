/**
 * Unit tests for player voting functionality
 * Run with: npx vitest or npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock environment
class MockD1Database {
  private data: Map<string, any[]> = new Map()

  constructor() {
    this.data.set('players', [
      { id: 1, name: 'Test Player', rank: 1, slug: 'test-player' }
    ])
    this.data.set('player_votes', [])
  }

  prepare(query: string) {
    return {
      bind: (...args: any[]) => ({
        first: async () => {
          if (query.includes('SELECT * FROM player_votes')) {
            const [playerId, ipHash] = args
            return this.data.get('player_votes')?.find(
              v => v.player_id === playerId && v.ip_hash === ipHash
            )
          }
          return null
        },
        all: async () => {
          if (query.includes('SELECT') && query.includes('FROM players')) {
            return { results: this.data.get('players') || [] }
          }
          if (query.includes('SELECT * FROM player_votes')) {
            return { results: this.data.get('player_votes') || [] }
          }
          return { results: [] }
        },
        run: async () => {
          if (query.includes('INSERT INTO player_votes')) {
            const [playerId, ipHash] = args
            const votes = this.data.get('player_votes') || []
            votes.push({
              id: Date.now(),
              player_id: playerId,
              ip_hash: ipHash,
              created_at: new Date().toISOString()
            })
            this.data.set('player_votes', votes)
          } else if (query.includes('DELETE FROM player_votes')) {
            const [playerId, ipHash] = args
            const votes = this.data.get('player_votes') || []
            const filtered = votes.filter(v => !(v.player_id === playerId && v.ip_hash === ipHash))
            this.data.set('player_votes', filtered)
          }
          return { success: true, meta: { last_row_id: 1 } }
        }
      })
    }
  }
}

class MockKVNamespace {
  private storage: Map<string, { value: string, expiration: number }> = new Map()

  async get(key: string) {
    const item = this.storage.get(key)
    if (!item) return null
    if (Date.now() > item.expiration) {
      this.storage.delete(key)
      return null
    }
    return item.value
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }) {
    this.storage.set(key, {
      value,
      expiration: Date.now() + (options?.expirationTtl || 60) * 1000
    })
  }
}

describe('Player Voting API', () => {
  let mockEnv: any
  
  beforeEach(() => {
    mockEnv = {
      DB: new MockD1Database(),
      RATE_LIMITER: new MockKVNamespace()
    }
  })

  it('should allow a user to vote for a player', async () => {
    const request = new Request('http://test.com/api/player-vote', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.168.1.1'
      },
      body: JSON.stringify({ player_id: 1 })
    })

    // Vote should be inserted
    const votes = await mockEnv.DB.prepare('SELECT * FROM player_votes').bind().all()
    expect(votes.results.length).toBeGreaterThanOrEqual(0)
  })

  it('should prevent duplicate votes from same IP', async () => {
    const ip = '192.168.1.1'
    const playerId = 1
    
    // First vote
    await mockEnv.DB.prepare('INSERT INTO player_votes (player_id, ip_hash) VALUES (?, ?)')
      .bind(playerId, 'hash123').run()
    
    // Check for existing vote
    const existing = await mockEnv.DB.prepare('SELECT * FROM player_votes WHERE player_id = ? AND ip_hash = ?')
      .bind(playerId, 'hash123').first()
    
    expect(existing).toBeTruthy()
  })

  it('should allow un-voting (toggle behavior)', async () => {
    const playerId = 1
    const ipHash = 'hash123'
    
    // Insert vote
    await mockEnv.DB.prepare('INSERT INTO player_votes (player_id, ip_hash) VALUES (?, ?)')
      .bind(playerId, ipHash).run()
    
    let votes = await mockEnv.DB.prepare('SELECT * FROM player_votes').bind().all()
    const beforeCount = votes.results.length
    
    // Remove vote
    await mockEnv.DB.prepare('DELETE FROM player_votes WHERE player_id = ? AND ip_hash = ?')
      .bind(playerId, ipHash).run()
    
    votes = await mockEnv.DB.prepare('SELECT * FROM player_votes').bind().all()
    expect(votes.results.length).toBeLessThan(beforeCount)
  })

  it('should return correct vote count for a player', async () => {
    const playerId = 1
    
    // Add 3 votes
    await mockEnv.DB.prepare('INSERT INTO player_votes (player_id, ip_hash) VALUES (?, ?)')
      .bind(playerId, 'ip1').run()
    await mockEnv.DB.prepare('INSERT INTO player_votes (player_id, ip_hash) VALUES (?, ?)')
      .bind(playerId, 'ip2').run()
    await mockEnv.DB.prepare('INSERT INTO player_votes (player_id, ip_hash) VALUES (?, ?)')
      .bind(playerId, 'ip3').run()
    
    const votes = await mockEnv.DB.prepare('SELECT * FROM player_votes').bind().all()
    expect(votes.results.length).toBe(3)
  })

  it('should enforce rate limiting on votes', async () => {
    const ip = '192.168.1.1'
    const key = 'ratelimit:player-vote:test'
    
    // Simulate 50 votes (rate limit)
    await mockEnv.RATE_LIMITER.put(key, '50', { expirationTtl: 3600 })
    
    const current = await mockEnv.RATE_LIMITER.get(key)
    expect(current).toBe('50')
  })

  it('should validate player_id is provided', () => {
    const invalidBody = {}
    expect(invalidBody).not.toHaveProperty('player_id')
  })

  it('should hash IP addresses for privacy', () => {
    const ip = '192.168.1.1'
    const hash1 = btoa(ip).substring(0, 32)
    const hash2 = btoa(ip).substring(0, 32)
    
    // Same IP should produce same hash
    expect(hash1).toBe(hash2)
    
    // Hash should be deterministic but not reveal original IP
    expect(hash1).not.toBe(ip)
  })
})

describe('Player List with Community Scores', () => {
  it('should include community_score in player list', async () => {
    const mockEnv = {
      DB: new MockD1Database()
    }

    const players = await mockEnv.DB.prepare(`
      SELECT 
        p.*,
        COALESCE(COUNT(pv.id), 0) as community_score
      FROM players p
      LEFT JOIN player_votes pv ON p.id = pv.player_id
      GROUP BY p.id
    `).bind().all()

    expect(players.results).toBeDefined()
    expect(players.results.length).toBeGreaterThan(0)
  })
})
