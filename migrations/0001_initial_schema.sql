-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL,
  school TEXT NOT NULL,
  height TEXT,
  weight TEXT,
  rank INTEGER,
  projected_round TEXT,
  consensus_grade REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expert reports table
CREATE TABLE IF NOT EXISTS expert_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  summary TEXT,
  strengths TEXT,
  weaknesses TEXT,
  scheme_fit TEXT,
  nfl_comp TEXT,
  floor TEXT,
  ceiling TEXT,
  risk TEXT,
  full_report_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Community reports table
CREATE TABLE IF NOT EXISTS community_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  display_name TEXT,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  ip_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES community_reports(id),
  UNIQUE(report_id, ip_hash)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_players_slug ON players(slug);
CREATE INDEX IF NOT EXISTS idx_players_rank ON players(rank);
CREATE INDEX IF NOT EXISTS idx_community_reports_player ON community_reports(player_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_score ON community_reports(score DESC);
CREATE INDEX IF NOT EXISTS idx_votes_report ON votes(report_id);
