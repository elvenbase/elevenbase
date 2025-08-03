#!/bin/bash

# ============================================================================
# DEPLOYMENT SCRIPT FOR JERSEY TEMPLATES SYSTEM
# ============================================================================
# This script helps deploy the jersey templates system to Supabase
# ============================================================================

echo "🚀 Starting Jersey Templates System Deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory."
    echo "   Please run: supabase init"
    exit 1
fi

echo "✅ Supabase project detected"

# Option 1: Deploy using migrations
echo "📦 Deploying using Supabase migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration deployed successfully!"
else
    echo "❌ Migration failed. Trying manual SQL execution..."
    
    # Option 2: Manual SQL execution
    echo "📝 Executing manual SQL setup..."
    
    # Read the SQL file
    SQL_CONTENT=$(cat manual_jersey_setup.sql)
    
    echo "🔧 Please copy and paste the following SQL into your Supabase SQL Editor:"
    echo ""
    echo "=========================================="
    echo "$SQL_CONTENT"
    echo "=========================================="
    echo ""
    echo "📋 Or run: cat manual_jersey_setup.sql | pbcopy (on macOS)"
    echo "📋 Or run: cat manual_jersey_setup.sql | xclip -selection clipboard (on Linux)"
fi

echo ""
echo "🎉 Setup complete! Your jersey templates system is ready."
echo ""
echo "📋 Next steps:"
echo "   1. Verify the tables were created in Supabase Dashboard"
echo "   2. Check that the storage bucket 'jerseys' exists"
echo "   3. Test the RLS policies"
echo "   4. Start using the jersey templates in your app!"