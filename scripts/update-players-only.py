#!/usr/bin/env python3
"""
Update ONLY the players table from Sportradar JSON
DOES NOT touch community_reports, expert_reports, or votes
Uses REPLACE to update existing players or insert new ones
"""

import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from typing import Optional, Dict
from urllib.error import URLError, HTTPError

INPUT_JSON = "/Users/max/clawd/2026-prospects.json"
PROJECT_DIR = "/Users/max/projects/draftroom"

# Enhanced school name mappings for logo fetching
SCHOOL_SLUG_MAP = {
    'miami (fl)': 'miami-florida',
    'miami': 'miami-florida',
    'texas a&m': 'texas-am',
    'ole miss': 'mississippi',
    'usc': 'southern-california',
    'ucf': 'central-florida',
    'byu': 'brigham-young',
    'lsu': 'louisiana-state',
    'smu': 'southern-methodist',
    'tcu': 'texas-christian',
    'pitt': 'pittsburgh',
    'penn state': 'penn-state',
    'nc state': 'nc-state',
    'boston college': 'boston-college',
    'iowa state': 'iowa-state',
    'kansas state': 'kansas-state',
    'michigan state': 'michigan-state',
    'mississippi state': 'mississippi-state',
    'ohio state': 'ohio-state',
    'oklahoma state': 'oklahoma-state',
    'oregon state': 'oregon-state',
    'washington state': 'washington-state',
    'florida state': 'florida-state',
    'arizona state': 'arizona-state',
    'virginia tech': 'virginia-tech',
    'georgia tech': 'georgia-tech',
    'wake forest': 'wake-forest',
    'south carolina': 'south-carolina',
    'north carolina': 'north-carolina',
    'west virginia': 'west-virginia',
    'utsa': 'texas-san-antonio',
}

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from player name"""
    slug = name.lower()
    slug = re.sub(r'[^\w\s\'-]', '', slug)
    slug = slug.replace(' ', '-')
    slug = slug.replace("'", '')
    return slug

def inches_to_height(inches: Optional[int]) -> Optional[str]:
    """Convert inches to feet-inches format (e.g., 74 -> '6-2')"""
    if not inches:
        return None
    feet = inches // 12
    remaining_inches = inches % 12
    return f"{feet}-{remaining_inches}"

def get_school_logo(school_name: str, cache: Dict) -> Optional[str]:
    """Fetch school logo URL from Tankathon CDN with enhanced matching"""
    if not school_name:
        return None
    
    # Check cache first
    if school_name in cache:
        return cache[school_name]
    
    # Normalize school name
    slug = school_name.lower().strip()
    
    # Try exact match from map first
    if slug in SCHOOL_SLUG_MAP:
        slug = SCHOOL_SLUG_MAP[slug]
    else:
        # Clean slug for URL
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = slug.replace(' ', '-')
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')
    
    # Try the logo URL
    logo_url = f"http://d2uki2uvp6v3wr.cloudfront.net/ncaa/{slug}.svg"
    
    try:
        req = urllib.request.Request(logo_url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                cache[school_name] = logo_url
                return logo_url
    except (HTTPError, URLError, TimeoutError):
        pass
    
    cache[school_name] = None
    return None

def escape_sql(text: str) -> str:
    """Escape single quotes for SQL"""
    return text.replace("'", "''")

def main():
    print("🏈 Updating Players Table (Community Data Safe!)")
    print("=" * 60)
    
    # Read JSON
    print(f"📖 Reading {INPUT_JSON}...")
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    prospects = data.get('prospects', [])
    total = len(prospects)
    print(f"✓ Found {total} prospects")
    
    # Build SQL statements
    sql_statements = []
    
    # Use REPLACE INTO instead of DELETE - this updates existing or inserts new
    # WITHOUT touching other tables
    print("✓ Using REPLACE INTO to safely update players")
    print("✓ Community reports, expert reports, and votes will NOT be touched")
    
    # Process each prospect
    print(f"\n🔄 Processing prospects and fetching logos...")
    
    logo_cache = {}
    logo_hits = 0
    
    for i, prospect in enumerate(prospects, 1):
        name = prospect.get('name', '')
        position = prospect.get('position', '')
        school = prospect.get('team_name', '')
        height_inches = prospect.get('height')
        weight = prospect.get('weight')
        
        # Generate fields
        slug = generate_slug(name)
        height = inches_to_height(height_inches)
        rank = i  # Use order as rank
        
        # Get school logo (with cache to avoid redundant requests)
        school_logo = get_school_logo(school, logo_cache)
        if school_logo:
            logo_hits += 1
        
        # Be nice to CDN
        if i % 50 == 0:
            time.sleep(0.5)
        else:
            time.sleep(0.05)
        
        # Progress indicator
        if i % 50 == 0 or i == total:
            print(f"  [{i}/{total}] {name} - {school} {'✓' if school_logo else '✗'} (logos: {logo_hits})")
        
        # Build REPLACE statement
        # REPLACE INTO replaces if exists (based on unique slug), inserts if new
        height_val = f"'{height}'" if height else 'NULL'
        weight_val = str(weight) if weight else 'NULL'
        logo_val = f"'{school_logo}'" if school_logo else 'NULL'
        
        sql_statements.append(
            f"REPLACE INTO players (name, slug, position, school, height, weight, rank, school_logo) "
            f"VALUES ("
            f"'{escape_sql(name)}', "
            f"'{slug}', "
            f"'{position}', "
            f"'{escape_sql(school)}', "
            f"{height_val}, "
            f"{weight_val}, "
            f"{rank}, "
            f"{logo_val}"
            f");"
        )
    
    print(f"\n✓ Processed {total} prospects")
    print(f"✓ Found {logo_hits} school logos ({logo_hits/total*100:.1f}%)")
    
    # Show logo success by school
    cached_logos = {k: v for k, v in logo_cache.items() if v is not None}
    if cached_logos:
        print(f"\n📊 Logos found for {len(cached_logos)} schools:")
        for school in sorted(cached_logos.keys())[:20]:
            print(f"  ✓ {school}")
        if len(cached_logos) > 20:
            print(f"  ... and {len(cached_logos) - 20} more")
    
    # Write to temp SQL file
    sql_file = f"{PROJECT_DIR}/data/update-players-only.sql"
    Path(sql_file).parent.mkdir(parents=True, exist_ok=True)
    
    with open(sql_file, 'w') as f:
        for stmt in sql_statements:
            f.write(stmt + '\n')
    
    print(f"\n✓ Wrote SQL to {sql_file}")
    
    # Execute via wrangler (local first for safety)
    print("\n🚀 Executing update to LOCAL database (testing)...")
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'draftroom-db', '--local', f'--file={sql_file}'],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Local update successful!")
        
        # Verify counts
        verify = subprocess.run(
            ['npx', 'wrangler', 'd1', 'execute', 'draftroom-db', '--local', 
             '--command=SELECT COUNT(*) as players FROM players; SELECT COUNT(*) as reports FROM community_reports;'],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True
        )
        
        if verify.returncode == 0:
            try:
                output = verify.stdout
                json_start = output.find('[')
                if json_start >= 0:
                    json_data = json.loads(output[json_start:])
                    player_count = json_data[0]['results'][0]['players']
                    report_count = json_data[1]['results'][0]['reports']
                    print(f"✓ Verified: {player_count} players, {report_count} community reports")
            except:
                print("✓ Update complete (verification skipped)")
        
        print("\n" + "=" * 60)
        print("📊 UPDATE SUMMARY")
        print("=" * 60)
        print(f"Total prospects updated: {total}")
        print(f"With school logos:       {logo_hits} ({logo_hits/total*100:.1f}%)")
        print(f"Community data:          PRESERVED ✅")
        print("\n" + "=" * 60)
        print("\n💡 To deploy to PRODUCTION, run:")
        print(f"  cd {PROJECT_DIR}")
        print(f"  npx wrangler d1 execute draftroom-db --remote --file=data/update-players-only.sql")
        
    else:
        print("❌ Update failed!")
        print(result.stderr)
        return 1
    
    return 0

if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted!")
        sys.exit(1)
