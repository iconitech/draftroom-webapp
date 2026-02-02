#!/bin/bash

# Simple admin script to update expert reports
# Usage: ./update-expert-report.sh <player_id>

PLAYER_ID=$1
PASSWORD="draft2026admin"
API_URL="http://localhost:8787/api/admin/expert-report"

if [ -z "$PLAYER_ID" ]; then
  echo "Usage: ./update-expert-report.sh <player_id>"
  echo "Example: ./update-expert-report.sh 1"
  exit 1
fi

echo "Updating expert report for player ID: $PLAYER_ID"
echo "Enter the following (press Ctrl+D when done with multi-line input):"
echo ""

read -p "Summary: " SUMMARY
read -p "Strengths: " STRENGTHS
read -p "Weaknesses: " WEAKNESSES
read -p "Scheme Fit: " SCHEME_FIT
read -p "NFL Comparison: " NFL_COMP
read -p "Floor: " FLOOR
read -p "Ceiling: " CEILING
read -p "Risk Profile: " RISK

curl -X PUT "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PASSWORD" \
  -d "{
    \"player_id\": $PLAYER_ID,
    \"summary\": \"$SUMMARY\",
    \"strengths\": \"$STRENGTHS\",
    \"weaknesses\": \"$WEAKNESSES\",
    \"scheme_fit\": \"$SCHEME_FIT\",
    \"nfl_comp\": \"$NFL_COMP\",
    \"floor\": \"$FLOOR\",
    \"ceiling\": \"$CEILING\",
    \"risk\": \"$RISK\"
  }"

echo ""
echo "Done!"
