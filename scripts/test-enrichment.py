#!/usr/bin/env python3
"""Test the enrichment script on top 5 players"""

import sys
import re
import urllib.request
from urllib.error import URLError, HTTPError

def clean_name_for_url(name: str) -> str:
    # Convert suffixes to lowercase and remove periods
    name = re.sub(r'\s+Jr\.?$', ' Jr', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+Sr\.?$', ' Sr', name, flags=re.IGNORECASE)
    return name.strip()

def search_tankathon(name: str, position: str):
    try:
        clean = clean_name_for_url(name)
        slug = clean.lower().replace(' ', '-').replace("'", "")
        
        url = f"https://www.tankathon.com/nfl/players/{slug}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            
            # New patterns based on actual HTML structure
            # Height: <span class="feet">6'</span><span class="inches">5&quot;</span>
            feet_match = re.search(r'<span class="feet">(\d+)\'</span>', html)
            inches_match = re.search(r'<span class="inches">(\d+)&quot;</span>', html)
            
            # Weight: <div class="value">225<span class="small">lbs</span>
            weight_match = re.search(r'<div class="label">Weight</div><div class="value">(\d+)<span class="small">lbs</span>', html)
            
            # School logo: src="http://d2uki2uvp6v3wr.cloudfront.net/ncaa/indiana.svg"
            logo_match = re.search(r'src="(http://d2uki2uvp6v3wr\.cloudfront\.net/ncaa/[^"]+\.svg)"', html)
            
            if feet_match and inches_match and weight_match:
                feet = feet_match.group(1)
                inches = inches_match.group(1)
                height = f"{feet}-{inches}"
                weight = weight_match.group(1)
                logo = logo_match.group(1) if logo_match else None
                
                print(f"✓ {name}: {height}, {weight} lbs")
                if logo:
                    print(f"  Logo: {logo}")
                return True
            else:
                print(f"✗ {name}: Found page but couldn't extract data")
                if not feet_match or not inches_match:
                    print(f"  Height missing: feet={bool(feet_match)}, inches={bool(inches_match)}")
                if not weight_match:
                    print(f"  Weight missing")
                return False
    
    except HTTPError as e:
        print(f"✗ {name}: HTTP {e.code}")
        return False
    except (URLError, TimeoutError) as e:
        print(f"✗ {name}: Network error")
        return False

# Test with top 5 from CSV
test_players = [
    ("Fernando Mendoza", "QB"),
    ("Rueben Bain Jr.", "ED"),
    ("Arvell Reese", "LB"),
    ("David Bailey", "ED"),
    ("Caleb Downs", "S")
]

print("Testing enrichment on top 5 players:\n")
success = 0
for name, pos in test_players:
    if search_tankathon(name, pos):
        success += 1
    print()

print(f"Success rate: {success}/{len(test_players)}")
