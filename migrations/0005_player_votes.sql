-- Player votes table for community big board scoring
CREATE TABLE IF NOT EXISTS player_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(player_id, ip_hash)
);

-- Index for fast vote counting
CREATE INDEX idx_player_votes_player_id ON player_votes(player_id);
CREATE INDEX idx_player_votes_ip_hash ON player_votes(ip_hash);
