export interface Env {
  DB: D1Database;
  RATE_LIMITER: KVNamespace;
  ADMIN_PASSWORD: string;
}

// Helper to hash IP addresses for privacy
function hashIP(ip: string): string {
  return btoa(ip).substring(0, 32);
}

// Rate limiting helper
async function checkRateLimit(env: Env, ip: string, action: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (!env.RATE_LIMITER) return true; // Skip if KV not available (local dev)
  
  const key = `ratelimit:${action}:${hashIP(ip)}`;
  const current = await env.RATE_LIMITER.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= limit) {
    return false; // Rate limit exceeded
  }
  
  await env.RATE_LIMITER.put(key, (count + 1).toString(), { expirationTtl: windowSeconds });
  return true;
}

// Input validation helpers
function sanitizeText(text: string, maxLength: number): string {
  return text.trim().substring(0, maxLength);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Profanity filter - basic word list
function containsProfanity(text: string): boolean {
  const profanityList = [
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'crap', 
    'bastard', 'dick', 'cock', 'pussy', 'slut', 'whore', 'fag',
    'nigger', 'nigga', 'retard', 'rape', 'nazi', 'hitler'
  ];
  
  const lowerText = text.toLowerCase();
  
  // Check for exact words or words with common character substitutions
  for (const word of profanityList) {
    const pattern = word.split('').map(char => {
      // Handle common substitutions: a->@, e->3, i->1, o->0, s->$
      if (char === 'a') return '[a@4]';
      if (char === 'e') return '[e3]';
      if (char === 'i') return '[i1!]';
      if (char === 'o') return '[o0]';
      if (char === 's') return '[s$5]';
      return char;
    }).join('[\\s\\-_]*'); // Allow spaces, dashes, underscores between letters
    
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    if (regex.test(lowerText)) {
      return true;
    }
  }
  
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // GET /api/players - Get all players with community vote counts
      if (path === '/api/players' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT 
            p.*,
            COALESCE(COUNT(pv.id), 0) as community_score
          FROM players p
          LEFT JOIN player_votes pv ON p.id = pv.player_id
          GROUP BY p.id
          ORDER BY p.rank ASC
        `).all();
        return Response.json(results, { headers: corsHeaders });
      }

      // GET /api/players/:slug - Get player with expert report and community reports
      if (path.startsWith('/api/players/') && request.method === 'GET') {
        const slug = path.split('/')[3];
        
        const player = await env.DB.prepare(
          'SELECT * FROM players WHERE slug = ?'
        ).bind(slug).first();

        if (!player) {
          return Response.json({ error: 'Player not found' }, { status: 404, headers: corsHeaders });
        }

        const expertReport = await env.DB.prepare(
          'SELECT * FROM expert_reports WHERE player_id = ?'
        ).bind(player.id).first();

        const { results: communityReports } = await env.DB.prepare(
          'SELECT * FROM community_reports WHERE player_id = ? ORDER BY score DESC'
        ).bind(player.id).all();

        return Response.json({
          player,
          expertReport,
          communityReports
        }, { headers: corsHeaders });
      }

      // POST /api/reports - Submit a community report
      if (path === '/api/reports' && request.method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        
        // Rate limiting: max 3 reports per hour per IP
        const rateLimitOk = await checkRateLimit(env, ip, 'report', 3, 3600);
        if (!rateLimitOk) {
          return Response.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429, headers: corsHeaders });
        }

        const body: any = await request.json();
        const { player_id, display_name, email, content, honeypot, submit_time } = body;

        // Anti-bot: honeypot field (should be empty)
        if (honeypot && honeypot.length > 0) {
          return Response.json({ error: 'Invalid submission' }, { status: 400, headers: corsHeaders });
        }

        // Anti-bot: minimum time check (prevent instant submits)
        if (submit_time && Date.now() - submit_time < 3000) {
          return Response.json({ error: 'Submission too fast. Please take your time.' }, { status: 400, headers: corsHeaders });
        }

        // Validation: required fields
        if (!display_name || !email || !content) {
          return Response.json({ error: 'Name, email, and content are required' }, { status: 400, headers: corsHeaders });
        }

        // Validation: email format
        if (!isValidEmail(email)) {
          return Response.json({ error: 'Invalid email address' }, { status: 400, headers: corsHeaders });
        }

        // Sanitize inputs
        const sanitizedName = sanitizeText(display_name, 100);
        const sanitizedEmail = sanitizeText(email, 254);
        const sanitizedContent = sanitizeText(content, 2500);

        // Validation: content length
        if (sanitizedContent.length < 50) {
          return Response.json({ error: 'Report must be at least 50 characters' }, { status: 400, headers: corsHeaders });
        }

        if (content.length > 2500) {
          return Response.json({ error: 'Report must be 2500 characters or less' }, { status: 400, headers: corsHeaders });
        }

        // Validation: profanity check
        if (containsProfanity(sanitizedContent) || containsProfanity(sanitizedName)) {
          return Response.json({ error: 'Please keep your report professional and avoid inappropriate language' }, { status: 400, headers: corsHeaders });
        }

        const ip_hash = hashIP(ip);

        const result = await env.DB.prepare(
          'INSERT INTO community_reports (player_id, display_name, email, content, ip_hash) VALUES (?, ?, ?, ?, ?)'
        ).bind(player_id, sanitizedName, sanitizedEmail, sanitizedContent, ip_hash).run();

        return Response.json({ success: true, id: result.meta.last_row_id }, { headers: corsHeaders });
      }

      // POST /api/vote - Vote on a community report
      if (path === '/api/vote' && request.method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        
        // Rate limiting: max 20 votes per minute per IP
        const rateLimitOk = await checkRateLimit(env, ip, 'vote', 20, 60);
        if (!rateLimitOk) {
          return Response.json({ error: 'Rate limit exceeded. Slow down!' }, { status: 429, headers: corsHeaders });
        }

        const body: any = await request.json();
        const { report_id, vote_type } = body; // vote_type: 'up' or 'down'
        
        // Validate vote type
        if (vote_type !== 'up' && vote_type !== 'down') {
          return Response.json({ error: 'Invalid vote type' }, { status: 400, headers: corsHeaders });
        }

        const ip_hash = hashIP(ip);

        // Check if already voted
        const existingVote = await env.DB.prepare(
          'SELECT * FROM votes WHERE report_id = ? AND ip_hash = ?'
        ).bind(report_id, ip_hash).first();

        if (existingVote) {
          return Response.json({ error: 'Already voted on this report' }, { status: 400, headers: corsHeaders });
        }

        // Insert vote
        await env.DB.prepare(
          'INSERT INTO votes (report_id, ip_hash, vote_type) VALUES (?, ?, ?)'
        ).bind(report_id, ip_hash, vote_type).run();

        // Update report scores
        if (vote_type === 'up') {
          await env.DB.prepare(
            'UPDATE community_reports SET upvotes = upvotes + 1, score = score + 1 WHERE id = ?'
          ).bind(report_id).run();
        } else {
          await env.DB.prepare(
            'UPDATE community_reports SET downvotes = downvotes + 1, score = score - 1 WHERE id = ?'
          ).bind(report_id).run();
        }

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // POST /api/player-vote - Upvote a player on the Big Board
      if (path === '/api/player-vote' && request.method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        
        // Rate limiting: max 50 player votes per hour per IP
        const rateLimitOk = await checkRateLimit(env, ip, 'player-vote', 50, 3600);
        if (!rateLimitOk) {
          return Response.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429, headers: corsHeaders });
        }

        const body: any = await request.json();
        const { player_id } = body;
        
        if (!player_id) {
          return Response.json({ error: 'Player ID required' }, { status: 400, headers: corsHeaders });
        }

        const ip_hash = hashIP(ip);

        // Check if already voted for this player
        const existingVote = await env.DB.prepare(
          'SELECT * FROM player_votes WHERE player_id = ? AND ip_hash = ?'
        ).bind(player_id, ip_hash).first();

        if (existingVote) {
          // Allow un-voting (toggle behavior)
          await env.DB.prepare(
            'DELETE FROM player_votes WHERE player_id = ? AND ip_hash = ?'
          ).bind(player_id, ip_hash).run();
          
          return Response.json({ success: true, action: 'removed' }, { headers: corsHeaders });
        }

        // Insert new vote
        await env.DB.prepare(
          'INSERT INTO player_votes (player_id, ip_hash) VALUES (?, ?)'
        ).bind(player_id, ip_hash).run();

        return Response.json({ success: true, action: 'added' }, { headers: corsHeaders });
      }

      // PUT /api/admin/expert-report - Update expert report (admin only)
      if (path === '/api/admin/expert-report' && request.method === 'PUT') {
        const authHeader = request.headers.get('Authorization');
        const password = authHeader?.replace('Bearer ', '');

        if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
          return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const body: any = await request.json();
        const { player_id, summary, strengths, weaknesses, scheme_fit, nfl_comp, floor, ceiling, risk } = body;

        // Check if expert report exists
        const existing = await env.DB.prepare(
          'SELECT id FROM expert_reports WHERE player_id = ?'
        ).bind(player_id).first();

        if (existing) {
          // Update
          await env.DB.prepare(
            `UPDATE expert_reports SET 
             summary = ?, strengths = ?, weaknesses = ?, scheme_fit = ?, 
             nfl_comp = ?, floor = ?, ceiling = ?, risk = ?
             WHERE player_id = ?`
          ).bind(summary, strengths, weaknesses, scheme_fit, nfl_comp, floor, ceiling, risk, player_id).run();
        } else {
          // Insert
          await env.DB.prepare(
            `INSERT INTO expert_reports 
             (player_id, summary, strengths, weaknesses, scheme_fit, nfl_comp, floor, ceiling, risk)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(player_id, summary, strengths, weaknesses, scheme_fit, nfl_comp, floor, ceiling, risk).run();
        }

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });

    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
  },
};
