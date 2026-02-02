#!/usr/bin/env python3
"""
Import enriched prospects CSV into DraftRoom database
Clears existing data and imports fresh 2026 prospects
"""

import csv
import re
import subprocess
import json

INPUT_CSV = "/Users/max/projects/draftroom/data/prospects-enriched.csv"

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from player name"""
    # Convert to lowercase
    slug = name.lower()
    # Remove punctuation except hyphens and apostrophes
    slug = re.sub(r'[^\w\s\'-]', '', slug)
    # Replace spaces with hyphens
    slug = slug.replace(' ', '-')
    # Remove apostrophes
    slug = slug.replace("'", '')
    return slug

def main():
    print("🏈 Importing 2026 NFL Draft Prospects")
    print("=" * 50)
    
    # Read CSV
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        prospects = list(reader)
    
    print(f"📊 Found {len(prospects)} prospects in CSV")
    
    # Build SQL statements
    sql_statements = []
    
    # Clear existing data (in correct order to respect foreign keys)
    sql_statements.append("PRAGMA foreign_keys = OFF;")
    sql_statements.append("DELETE FROM votes;")
    sql_statements.append("DELETE FROM community_reports;")
    sql_statements.append("DELETE FROM expert_reports;")
    sql_statements.append("DELETE FROM players;")
    sql_statements.append("PRAGMA foreign_keys = ON;")
    print("✓ Will clear existing players and related data")
    
    # Insert new prospects
    for row in prospects:
        name = row['Player']
        slug = generate_slug(name)
        position = row['Position']
        school = row['School']
        height = row['Height'] or None
        weight = row['Weight'] or None
        rank = int(row['Rank'])
        
        # Handle PFF Grade - convert to numeric or None
        pff_grade = row['PFF Grade'].strip()
        if pff_grade:
            try:
                pff_grade = float(pff_grade)
            except ValueError:
                pff_grade = None
        else:
            pff_grade = None
        
        # Projected round - try to extract number
        projected_round = None  # We don't have this in CSV
        
        # School logo URL
        school_logo = row['School_Logo'] or None
        
        # Build INSERT statement
        height_val = f"'{height}'" if height else 'NULL'
        weight_val = f"'{weight}'" if weight else 'NULL'
        pff_val = str(pff_grade) if pff_grade else 'NULL'
        logo_val = f"'{school_logo}'" if school_logo else 'NULL'
        
        sql_statements.append(
            f"INSERT INTO players (name, slug, position, school, height, weight, rank, pff_grade, scout_grade, school_logo) "
            f"VALUES ("
            f"'{name.replace(chr(39), chr(39)+chr(39))}', "  # Escape single quotes
            f"'{slug}', "
            f"'{position}', "
            f"'{school.replace(chr(39), chr(39)+chr(39))}', "
            f"{height_val}, "
            f"{weight_val}, "
            f"{rank}, "
            f"{pff_val}, "
            f"NULL, "  # scout_grade - will be added manually
            f"{logo_val}"
            f");"
        )
    
    print(f"✓ Prepared {len(prospects)} INSERT statements")
    
    # Write to temp SQL file
    sql_file = "/Users/max/projects/draftroom/data/import-prospects.sql"
    with open(sql_file, 'w') as f:
        for stmt in sql_statements:
            f.write(stmt + '\n')
    
    print(f"✓ Wrote SQL to {sql_file}")
    
    # Execute via wrangler
    print("\n🚀 Executing import...")
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'draftroom-db', '--local', f'--file={sql_file}'],
        cwd='/Users/max/projects/draftroom',
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Import successful!")
        
        # Verify count
        verify = subprocess.run(
            ['npx', 'wrangler', 'd1', 'execute', 'draftroom-db', '--local', '--command=SELECT COUNT(*) as count FROM players;'],
            cwd='/Users/max/projects/draftroom',
            capture_output=True,
            text=True
        )
        
        if verify.returncode == 0:
            # Parse JSON output
            try:
                output = verify.stdout
                # Find the JSON array in output
                json_start = output.find('[')
                if json_start >= 0:
                    json_data = json.loads(output[json_start:])
                    count = json_data[0]['results'][0]['count']
                    print(f"✓ Verified: {count} players in database")
            except:
                print("✓ Import complete (verification skipped)")
        
        print("\n📝 Summary:")
        print(f"  - Imported: {len(prospects)} prospects")
        print(f"  - With height/weight: {sum(1 for p in prospects if p['Height'] and p['Weight'])}")
        print(f"  - With PFF grades: {sum(1 for p in prospects if p['PFF Grade'])}")
        print(f"  - Scout grades: 0 (to be added manually)")
        
    else:
        print("❌ Import failed!")
        print(result.stderr)
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
