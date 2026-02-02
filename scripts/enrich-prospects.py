#!/usr/bin/env python3
"""
Prospect Data Enrichment Script
Fetches missing height/weight data for 2026 NFL Draft prospects
"""

import csv
import json
import time
import re
import sys
from pathlib import Path
from typing import Optional, Dict
import urllib.request
import urllib.parse
from urllib.error import URLError, HTTPError

# Configuration
INPUT_CSV = "/Users/max/.clawdbot/media/inbound/6e562302-1f43-45a6-a43a-854c466e9546.csv"
OUTPUT_CSV = "/Users/max/projects/draftroom/data/prospects-enriched.csv"
PROGRESS_FILE = "/Users/max/projects/draftroom/data/enrichment-progress.json"
RATE_LIMIT_DELAY = 2  # seconds between requests

# Create data directory
Path(OUTPUT_CSV).parent.mkdir(parents=True, exist_ok=True)

def load_progress() -> Dict:
    """Load progress from previous run"""
    if Path(PROGRESS_FILE).exists():
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {"completed": [], "data": {}}

def save_progress(progress: Dict):
    """Save progress for resume capability"""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def clean_name_for_url(name: str) -> str:
    """Clean player name for URL search"""
    # Convert suffixes to lowercase and remove periods
    name = re.sub(r'\s+Jr\.?$', ' Jr', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+Sr\.?$', ' Sr', name, flags=re.IGNORECASE)
    return name.strip()

def search_tankathon(name: str, position: str) -> Optional[Dict]:
    """Search Tankathon for player data"""
    try:
        # Create URL-friendly name
        clean = clean_name_for_url(name)
        slug = clean.lower().replace(' ', '-').replace("'", "")
        
        url = f"https://www.tankathon.com/nfl/players/{slug}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            
            # Extract height: <span class="feet">6'</span><span class="inches">5&quot;</span>
            feet_match = re.search(r'<span class="feet">(\d+)\'</span>', html)
            inches_match = re.search(r'<span class="inches">(\d+)&quot;</span>', html)
            
            # Extract weight: <div class="value">225<span class="small">lbs</span>
            weight_match = re.search(r'<div class="label">Weight</div><div class="value">(\d+)<span class="small">lbs</span>', html)
            
            # Extract school logo: src="http://d2uki2uvp6v3wr.cloudfront.net/ncaa/indiana.svg"
            logo_match = re.search(r'src="(http://d2uki2uvp6v3wr\.cloudfront\.net/ncaa/[^"]+\.svg)"', html)
            
            if feet_match and inches_match and weight_match:
                feet = feet_match.group(1)
                inches = inches_match.group(1)
                height = f"{feet}-{inches}"
                weight = weight_match.group(1)
                logo = logo_match.group(1) if logo_match else ""
                
                return {
                    "height": height,
                    "weight": weight,
                    "logo": logo,
                    "source": "tankathon"
                }
    
    except (HTTPError, URLError, TimeoutError):
        pass
    
    return None

def search_espn(name: str, school: str, position: str) -> Optional[Dict]:
    """Search ESPN for player data (fallback)"""
    try:
        # ESPN search endpoint
        clean = clean_name_for_url(name)
        query = urllib.parse.quote(f"{clean} {school} {position} 2026")
        
        url = f"https://www.espn.com/nfl/draft2026/player/_/{query}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            
            # Extract height/weight from ESPN format
            height_match = re.search(r'(\d+)-(\d+)\s*HT', html)
            weight_match = re.search(r'(\d+)\s*WT', html)
            
            if height_match and weight_match:
                height = f"{height_match.group(1)}-{height_match.group(2)}"
                weight = weight_match.group(1)
                return {"height": height, "weight": weight, "logo": "", "source": "espn"}
    
    except (HTTPError, URLError, TimeoutError):
        pass
    
    return None

def enrich_player(name: str, position: str, school: str) -> Dict:
    """Try multiple sources to enrich player data"""
    
    # Try Tankathon first (most reliable for draft prospects)
    data = search_tankathon(name, position)
    if data:
        return data
    
    time.sleep(1)  # Brief delay before trying next source
    
    # Try ESPN as fallback
    data = search_espn(name, school, position)
    if data:
        return data
    
    return {"height": "", "weight": "", "logo": "", "source": "not_found"}

def main():
    print("🏈 NFL Draft Prospect Data Enrichment")
    print("=" * 50)
    
    # Load progress
    progress = load_progress()
    completed = set(progress.get("completed", []))
    enriched_data = progress.get("data", {})
    
    # Read input CSV
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Limit to top 100 for now
    rows = rows[:100]
    
    total = len(rows)
    print(f"Total prospects: {total}")
    print(f"Previously completed: {len(completed)}")
    print(f"Remaining: {total - len(completed)}\n")
    
    # Process each player
    for i, row in enumerate(rows, 1):
        rank = row['Rank']
        name = row['Player']
        position = row['Position']
        school = row['School']
        
        # Skip if already processed
        if rank in completed:
            continue
        
        print(f"[{i}/{total}] {name} ({position}, {school})...", end=' ')
        sys.stdout.flush()
        
        # Enrich data
        data = enrich_player(name, position, school)
        
        enriched_data[rank] = {
            "name": name,
            "height": data.get("height", ""),
            "weight": data.get("weight", ""),
            "logo": data.get("logo", ""),
            "source": data["source"]
        }
        
        completed.add(rank)
        
        # Save progress every 10 players
        if i % 10 == 0:
            save_progress({"completed": list(completed), "data": enriched_data})
        
        status = "✓" if data["height"] else "✗"
        print(f"{status} ({data['source']})")
        
        # Rate limiting
        time.sleep(RATE_LIMIT_DELAY)
    
    # Final save
    save_progress({"completed": list(completed), "data": enriched_data})
    
    # Write enriched CSV
    print("\n📝 Writing enriched CSV...")
    
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['Rank', 'Player', 'Position', 'School', 'Height', 'Weight', 'School_Logo', 'PFF Grade', 'Analysis']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in rows:
            rank = row['Rank']
            data = enriched_data.get(rank, {})
            
            writer.writerow({
                'Rank': rank,
                'Player': row['Player'],
                'Position': row['Position'],
                'School': row['School'],
                'Height': data.get('height', ''),
                'Weight': data.get('weight', ''),
                'School_Logo': data.get('logo', ''),
                'PFF Grade': row['PFF Grade'],
                'Analysis': row['Analysis']
            })
    
    # Summary
    found = sum(1 for d in enriched_data.values() if d.get('height'))
    print(f"\n✅ Complete!")
    print(f"Found data for: {found}/{total} ({found/total*100:.1f}%)")
    print(f"Output: {OUTPUT_CSV}")
    
    # Stats by source
    sources = {}
    for d in enriched_data.values():
        source = d.get('source', 'unknown')
        sources[source] = sources.get(source, 0) + 1
    
    print("\n📊 Sources:")
    for source, count in sources.items():
        print(f"  {source}: {count}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted! Progress saved. Run again to resume.")
        sys.exit(0)
