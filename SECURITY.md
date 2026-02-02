# DraftRoom Security Features

## SQL Injection Protection ✅
- All database queries use parameterized queries with `.bind()`
- User input never directly concatenated into SQL
- D1 prepared statements prevent injection attacks

## Rate Limiting ✅
- **Community reports**: Max 3 submissions per hour per IP
- **Votes**: Max 20 votes per minute per IP
- Uses Cloudflare KV for distributed rate limiting
- Falls back gracefully in local dev (no rate limits)

## Anti-Bot Protection ✅
- **Honeypot field**: Hidden field that bots will fill but humans won't see
- **Timing check**: Prevents instant form submissions (3 second minimum)
- **Email validation**: RFC-compliant email format checking
- **Content validation**: Minimum 50 characters for reports

## Input Validation & Sanitization ✅
- **Required fields**: Name, email, and content are mandatory
- **Length limits**: 
  - Name: 100 characters max
  - Email: 254 characters max
  - Content: 5000 characters max
- **Text trimming**: Removes leading/trailing whitespace
- **Email format**: Validates proper email structure

## Password-Protected Admin Features ✅
- Expert report editing requires password
- Password sent via Authorization header
- Can be changed anytime in environment variables
- UI shows edit button to all, but locks behind password prompt

## Privacy ✅
- IP addresses are hashed (SHA-256 via btoa) before storage
- Emails not displayed publicly (used only for spam prevention)
- Vote tracking anonymous (IP hash only)

## CORS ✅
- Configured for cross-origin requests
- Headers properly set for API access

## Future Enhancements
- [ ] CAPTCHA integration (Cloudflare Turnstile) for extra bot protection
- [ ] Email verification for community reports
- [ ] Admin dashboard for moderating reports
- [ ] Automated spam detection (keyword filtering, ML-based)
- [ ] IP banning for repeat offenders

## Configuration

### Change Admin Password
Update in `worker/index.ts` or set via environment variable:
```bash
wrangler secret put ADMIN_PASSWORD
```

### Enable Rate Limiting (Production)
1. Create KV namespace:
```bash
wrangler kv:namespace create RATE_LIMITER
```

2. Update `wrangler.toml` with the returned ID:
```toml
[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "your-kv-id-here"
```

## Testing Security Features

### Test Rate Limiting
```bash
# Submit 4 reports quickly (4th should fail)
for i in {1..4}; do
  curl -X POST http://localhost:8787/api/reports \
    -H "Content-Type: application/json" \
    -d '{"player_id":1,"display_name":"Test","email":"test@example.com","content":"'$(printf 'x%.0s' {1..60})'","honeypot":"","submit_time":'$(date +%s000)'}'
done
```

### Test Honeypot
```bash
# This should fail (honeypot filled)
curl -X POST http://localhost:8787/api/reports \
  -H "Content-Type: application/json" \
  -d '{"player_id":1,"display_name":"Bot","email":"bot@example.com","content":"'$(printf 'x%.0s' {1..60})'","honeypot":"http://spam.com"}'
```

### Test Password Protection
```bash
# Wrong password (should fail)
curl -X PUT http://localhost:8787/api/admin/expert-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrongpassword" \
  -d '{"player_id":1,"summary":"Test"}'

# Correct password (should succeed)
curl -X PUT http://localhost:8787/api/admin/expert-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer draft2026admin" \
  -d '{"player_id":1,"summary":"Updated summary"}'
```
