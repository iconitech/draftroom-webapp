#!/usr/bin/env python3
"""
Import 2026 NFL Draft Prospects from Sportradar JSON
Processes JSON data, fetches team logos, and imports to DraftRoom database
"""

import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from typing import Optional
from urllib.error import URLError, HTTPError

INPUT_JSON = "/Users/max/clawd/2026-prospects.json"
PROJECT_DIR = "/Users/max/projects/draftroom"

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

def get_school_logo(school_name: str) -> Optional[str]:
    """Fetch school logo URL from Tankathon CDN"""
    try:
        # Normalize school name to slug format
        slug = school_name.lower()
        
        # Handle special cases
        replacements = {
            'miami (fl)': 'miami-florida',
            'texas a&m': 'texas-am',
            'ole miss': 'mississippi',
            'usc': 'southern-california',
            'ucf': 'central-florida',
            'byu': 'brigham-young',
            'lsu': 'louisiana-state',
            'smu': 'southern-methodist',
            'tcu': 'texas-christian',
            'pitt': 'pittsburgh',
        }
        
        slug = replacements.get(slug, slug)
        
        # Clean slug
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = slug.replace(' ', '-')
        slug = re.sub(r'-+', '-', slug)
        
        # Try the logo URL
        logo_url = f"http://d2uki2uvp6v3wr.cloudfront.net/ncaa/{slug}.svg"
        
        # Verify it exists
        req = urllib.request.Request(logo_url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                return logo_url
        
    except (HTTPError, URLError, TimeoutError):
        pass
    
    return None

def escape_sql(text: str) -> str:
    """Escape single quotes for SQL"""
    return text.replace("'", "''")

def main():
    print("🏈 Importing 2026 NFL Draft Prospects from JSON")
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
    
    # Clear existing data
    sql_statements.append("PRAGMA foreign_keys = OFF;")
    sql_statements.append("DELETE FROM votes;")
    sql_statements.append("DELETE FROM community_reports;")
    sql_statements.append("DELETE FROM expert_reports;")
    sql_statements.append("DELETE FROM players;")
    sql_statements.append("PRAGMA foreign_keys = ON;")
    print("✓ Will clear existing players and related data")
    
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
        
        # Get school logo (with cache)
        school_logo = None
        if school:
            if school in logo_cache:
                school_logo = logo_cache[school]
            else:
                school_logo = get_school_logo(school)
                logo_cache[school] = school_logo
                if school_logo:
                    logo_hits += 1
                time.sleep(0.1)  # Be nice to the CDN
        
        # Progress indicator
        if i % 50 == 0 or i == total:
            print(f"  [{i}/{total}] {name} - {school} {'✓' if school_logo else '✗'}")
        
        # Build INSERT statement
        height_val = f"'{height}'" if height else 'NULL'
        weight_val = str(weight) if weight else 'NULL'
        logo_val = f"'{school_logo}'" if school_logo else 'NULL'
        
        sql_statements.append(
            f"INSERT INTO players (name, slug, position, school, height, weight, rank, school_logo) "
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
    
    # Write to temp SQL file
    sql_file = f"{PROJECT_DIR}/data/import-json-prospects.sql"
    Path(sql_file).parent.mkdir(parents=True, exist_ok=True)
    
    with open(sql_file, 'w') as f:
        for stmt in sql_statements:
            f.write(stmt + '\n')
    
    print(f"✓ Wrote SQL to {sql_file}")
    
    # Execute via wrangler
    print("\n🚀 Executing import to local database...")
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'draftroom-db', '--local', f'--file={sql_file}'],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Local import successful!")
        
        # Verify count
        verify = subprocess.run(
            ['npx', 'wrangler', 'd1', 'execute', 'draftroom-db', '--local', 
             '--command=SELECT COUNT(*) as count FROM players;'],
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
                    count = json_data[0]['results'][0]['count']
                    print(f"✓ Verified: {count} players in local database")
            except:
                print("✓ Import complete (verification skipped)")
        
        print("\n" + "=" * 60)
        print("📊 IMPORT SUMMARY")
        print("=" * 60)
        print(f"Total prospects imported: {total}")
        print(f"With height data:        {sum(1 for p in prospects if p.get('height'))}")
        print(f"With weight data:        {sum(1 for p in prospects if p.get('weight'))}")
        print(f"With school logos:       {logo_hits}")
        print(f"Positions covered:       {len(set(p.get('position') for p in prospects))}")
        print(f"Schools represented:     {len(set(p.get('team_name') for p in prospects))}")
        
        # Show position breakdown
        positions = {}
        for p in prospects:
            pos = p.get('position', 'Unknown')
            positions[pos] = positions.get(pos, 0) + 1
        
        print("\n📈 Position Breakdown:")
        for pos, count in sorted(positions.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {pos}: {count}")
        
        print("\n" + "=" * 60)
        print("\n✅ Database is now loaded with all 2026 prospects!")
        print("\n💡 Next steps:")
        print("  1. Start dev server: cd /Users/max/projects/draftroom && npm run dev")
        print("  2. Deploy to production: npx wrangler d1 execute draftroom-db --remote --file=data/import-json-prospects.sql")
        
    else:
        print("❌ Import failed!")
        print(result.stderr)
        return 1
    
    return 0

if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted!")
        sys.exit(1)
