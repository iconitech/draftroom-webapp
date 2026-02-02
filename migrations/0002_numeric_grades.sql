-- Migrate consensus_grade from TEXT to REAL (numeric)

-- Disable foreign keys temporarily
PRAGMA foreign_keys = OFF;

-- Create a new players table with numeric grades
CREATE TABLE players_new (
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

-- Copy data from old table, converting letter grades to numeric
INSERT INTO players_new (id, name, slug, position, school, height, weight, rank, projected_round, consensus_grade, created_at)
SELECT 
  id, name, slug, position, school, height, weight, rank, projected_round,
  CASE consensus_grade
    WHEN 'A+' THEN 97.0
    WHEN 'A' THEN 93.0
    WHEN 'A-' THEN 90.0
    WHEN 'B+' THEN 87.0
    WHEN 'B' THEN 83.0
    WHEN 'B-' THEN 80.0
    WHEN 'C+' THEN 77.0
    WHEN 'C' THEN 73.0
    WHEN 'C-' THEN 70.0
    WHEN 'D+' THEN 67.0
    WHEN 'D' THEN 63.0
    WHEN 'D-' THEN 60.0
    WHEN 'F' THEN 50.0
    ELSE 0.0
  END as consensus_grade,
  created_at
FROM players;

-- Drop old table
DROP TABLE players;

-- Rename new table
ALTER TABLE players_new RENAME TO players;

-- Recreate indexes
CREATE INDEX idx_players_slug ON players(slug);
CREATE INDEX idx_players_rank ON players(rank);

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;
