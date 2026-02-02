# DraftRoom - NFL Draft Scouting Hub

Community-driven NFL Draft scouting platform with expert analysis and Reddit-style voting.

**2026 NFL Draft Prospects** - Real data from Mel Kiper's Big Board (Jan 2026)

## Quick Start (Local Development)

### 1. Start the API (Cloudflare Workers)

```bash
npm run worker:dev
```

This starts the Workers API on http://localhost:8787

### 2. Start the Frontend (Next.js)

In a separate terminal:

```bash
npm run dev
```

This starts Next.js on http://localhost:3000

### 3. Open the App

Visit http://localhost:3000 in your browser!

## What Works Right Now

✅ **Homepage:**
- Top 30 2026 NFL Draft prospects (real data!)
- Search by player name or school
- Filter by position
- Sortable columns
- Mobile-responsive

✅ **Player Pages:**
- Player stats and measurables
- Expert scouting reports (Top 10 have detailed reports)
- Community scouting reports
- **Live voting** - upvote/downvote reports
- **Submit your own reports** - actually saved to database!
- Sort by: Top, New, Controversial
- IP-based vote tracking (one vote per IP per report)

✅ **Database:**
- Local SQLite (via Cloudflare D1)
- 30 real 2026 NFL Draft prospects
- Expert reports for top 10 players
- Fully functional voting system
- Community report submissions

## Admin: Update Expert Reports

### Simple Method (API Call)

Use the provided script:

```bash
./update-expert-report.sh <player_id>
```

Example:
```bash
./update-expert-report.sh 11  # Update Tyler Warren's expert report
```

The script will prompt you for all fields. Password: `draft2026admin`

### Advanced Method (Direct API)

```bash
curl -X PUT http://localhost:8787/api/admin/expert-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer draft2026admin" \
  -d '{
    "player_id": 11,
    "summary": "Your summary...",
    "strengths": "Your strengths...",
    "weaknesses": "Your weaknesses...",
    "scheme_fit": "Your scheme fit...",
    "nfl_comp": "NFL comparison...",
    "floor": "Floor projection...",
    "ceiling": "Ceiling projection...",
    "risk": "Risk profile..."
  }'
```

### Change Admin Password

Edit `worker/index.ts` line 6:

```typescript
const ADMIN_PASSWORD = 'your-new-password';
```

## API Endpoints

**Public:**
- `GET /api/players` - List all players
- `GET /api/players/:slug` - Get player details + reports
- `POST /api/reports` - Submit community report
- `POST /api/vote` - Vote on a report (up/down)

**Admin (requires Authorization header):**
- `PUT /api/admin/expert-report` - Update expert report

## Database

Local SQLite at `.wrangler/state/v3/d1/draftroom-db.sqlite`

**Reset database:**
```bash
rm .wrangler/state/v3/d1/draftroom-db.sqlite
sqlite3 .wrangler/state/v3/d1/draftroom-db.sqlite < migrations/0001_initial_schema.sql
sqlite3 .wrangler/state/v3/d1/draftroom-db.sqlite < seed-data.sql
```

**View data:**
```bash
sqlite3 .wrangler/state/v3/d1/draftroom-db.sqlite
```

Useful queries:
```sql
SELECT name, position, school FROM players ORDER BY rank;
SELECT * FROM community_reports;
SELECT * FROM votes;
```

## Tech Stack

- **Frontend:** Next.js 15 (React 19)
- **Backend:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Styling:** Pure CSS (no framework)
- **Deployment:** Cloudflare Pages + Workers (ready to deploy!)

## Deployment to Cloudflare

Coming next! The app is fully ready - just need to:
1. Create Cloudflare account
2. Run `wrangler d1 create draftroom-db` (production)
3. Update `wrangler.toml` with production database ID
4. Deploy Workers: `npm run worker:deploy`
5. Deploy Pages: Connect repo to Cloudflare Pages

## Project Structure

```
/src/app
  /page.tsx                    # Homepage (fetches from API)
  /player/[slug]/page.tsx      # Player detail (fetches + voting)
  /layout.tsx                  # Root layout
  /globals.css                 # Styles

/worker
  /index.ts                    # Cloudflare Workers API

/migrations
  /0001_initial_schema.sql     # Database schema

seed-data.sql                  # 2026 NFL Draft prospect data
update-expert-report.sh        # Admin helper script
wrangler.toml                  # Cloudflare Workers config
```

## Data Source

2026 NFL Draft prospect data from:
- Mel Kiper Jr.'s Big Board (ESPN, Jan 2026)
- Top 30 prospects with real measurables, schools, positions
- Expert scouting reports for Top 10 players

---

**Status:** ✅ Fully functional locally! Ready to deploy.

**Admin Password:** `draft2026admin` (change in production!)
