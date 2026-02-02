-- Add PFF grade, scout grade, and school logo fields

ALTER TABLE players ADD COLUMN pff_grade REAL;
ALTER TABLE players ADD COLUMN scout_grade REAL;
ALTER TABLE players ADD COLUMN school_logo TEXT;

-- Drop old consensus_grade column and projected_round if we want clean schema
-- (keeping for now for backward compatibility)
