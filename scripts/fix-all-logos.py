#!/usr/bin/env python3
"""
Fix all school logos using ESPN's reliable CDN
Maps school names to ESPN team IDs
"""

import subprocess

# ESPN team ID mapping for major schools
ESPN_TEAM_IDS = {
    'Alabama': 333,
    'Arizona': 12,
    'Arizona State': 9,
    'Arkansas': 8,
    'Auburn': 2,
    'Baylor': 239,
    'Boise State': 68,
    'Boston College': 103,
    'BYU': 252,
    'Buffalo': 2084,
    'California': 25,
    'Cincinnati': 2132,
    'Clemson': 228,
    'Colorado': 38,
    'Duke': 150,
    'East Carolina': 151,
    'Florida': 57,
    'Florida State': 52,
    'Georgia': 61,
    'Georgia State': 2247,
    'Georgia Tech': 59,
    'Houston': 248,
    'Illinois': 356,
    'Indiana': 84,
    'Iowa': 2294,
    'Iowa State': 66,
    'Kansas': 2305,
    'Kansas State': 2306,
    'Kentucky': 96,
    'LSU': 99,
    'Louisville': 97,
    'Maryland': 120,
    'Miami (FL)': 2390,
    'Michigan': 130,
    'Michigan State': 127,
    'Minnesota': 135,
    'Mississippi State': 344,
    'Missouri': 142,
    'Nebraska': 158,
    'Nevada': 2440,
    'North Carolina': 153,
    'North Carolina State': 152,
    'Notre Dame': 87,
    'Ohio State': 194,
    'Oklahoma': 201,
    'Oklahoma State': 197,
    'Ole Miss': 145,
    'Oregon': 2483,
    'Oregon State': 204,
    'Penn State': 213,
    'Pittsburgh': 221,
    'Purdue': 2509,
    'Rutgers': 164,
    'SMU': 2567,
    'South Carolina': 2579,
    'Stanford': 24,
    'Syracuse': 183,
    'TCU': 2628,
    'Tennessee': 2633,
    'Texas': 251,
    'Texas A&M': 245,
    'Texas Tech': 2641,
    'UCF': 2116,
    'UCLA': 26,
    'UMass': 113,
    'USC': 30,
    'UTSA': 2636,
    'Utah': 254,
    'Vanderbilt': 238,
    'Virginia': 258,
    'Virginia Tech': 259,
    'Wake Forest': 154,
    'Washington': 264,
    'Washington State': 265,
    'West Virginia': 277,
    'Wisconsin': 275,
}

def main():
    print("🏈 Fixing School Logos with ESPN CDN")
    print("=" * 60)
    
    sql_statements = []
    fixed_count = 0
    
    for school, team_id in ESPN_TEAM_IDS.items():
        logo_url = f"https://a.espncdn.com/i/teamlogos/ncaa/500/{team_id}.png"
        escaped_school = school.replace("'", "''")
        sql_statements.append(
            f"UPDATE players SET school_logo='{logo_url}' WHERE school='{escaped_school}';")
        fixed_count += 1
    
    # Clear broken Tankathon logos
    sql_statements.insert(0, "UPDATE players SET school_logo=NULL WHERE school_logo LIKE '%d2uki2uvp6v3wr%';")
    
    # Write SQL file
    sql_file = "/Users/max/projects/draftroom/data/fix-all-logos.sql"
    with open(sql_file, 'w') as f:
        for stmt in sql_statements:
            f.write(stmt + '\n')
    
    print(f"✓ Prepared updates for {fixed_count} schools")
    print(f"✓ Wrote SQL to {sql_file}")
    
    # Execute locally first
    print("\n🚀 Updating local database...")
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'draftroom-db', '--local', f'--file={sql_file}'],
        cwd='/Users/max/projects/draftroom',
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Local update successful!")
        print("\n💡 To deploy to production, run:")
        print("  cd /Users/max/projects/draftroom")
        print(f"  npx wrangler d1 execute draftroom-db --remote --file=data/fix-all-logos.sql")
    else:
        print("❌ Update failed!")
        print(result.stderr)
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
