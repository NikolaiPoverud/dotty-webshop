#!/bin/bash
# ARCH-005: Generate Supabase TypeScript types
#
# This script generates TypeScript types from your Supabase database schema.
# Run this whenever you make database schema changes to keep types in sync.
#
# Prerequisites:
# 1. Supabase CLI installed: npm install -g supabase
# 2. Logged in to Supabase: npx supabase login
# 3. Project reference set in .env.local: SUPABASE_PROJECT_REF=your-project-ref
#
# Usage:
#   ./scripts/generate-types.sh
#
# The generated types will be written to src/types/supabase.ts

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Check for required environment variables
if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "Error: SUPABASE_PROJECT_REF not set in .env.local"
  echo ""
  echo "To set up type generation:"
  echo "1. Get your project reference from the Supabase dashboard URL"
  echo "   (e.g., https://app.supabase.com/project/YOUR_PROJECT_REF)"
  echo "2. Add to .env.local: SUPABASE_PROJECT_REF=YOUR_PROJECT_REF"
  echo "3. Run: npx supabase login"
  echo "4. Run this script again"
  exit 1
fi

echo "Generating Supabase types for project: $SUPABASE_PROJECT_REF"

# Generate types
npx supabase gen types typescript \
  --project-id "$SUPABASE_PROJECT_REF" \
  > src/types/supabase.ts

echo "Types generated successfully at src/types/supabase.ts"
echo ""
echo "Remember to:"
echo "1. Review the generated types"
echo "2. Update your application types in src/types/index.ts if needed"
echo "3. Commit the changes"
