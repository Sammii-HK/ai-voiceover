#!/bin/bash
# Cloudflare Workers deployment script

set -e

echo "🌍 Deploying AI Voiceover to Cloudflare Edge Network"

# Check if wrangler is logged in
if ! wrangler whoami >/dev/null 2>&1; then
    echo "❌ Please login to Cloudflare first:"
    echo "   wrangler login"
    exit 1
fi

# Create D1 database if it doesn't exist
echo "📊 Setting up D1 database..."
if ! wrangler d1 list | grep -q "ai-voiceover-db"; then
    echo "Creating new D1 database..."
    DB_ID=$(wrangler d1 create ai-voiceover-db --json | jq -r '.database_id')
    echo "Database created with ID: $DB_ID"
    echo "⚠️  Please update wrangler.toml with this database_id: $DB_ID"
    read -p "Press Enter after updating wrangler.toml..."
fi

# Run database migrations
echo "🔄 Running database migrations..."
wrangler d1 execute ai-voiceover-db --file=./schema.sql

# Create R2 bucket if it doesn't exist
echo "🪣 Setting up R2 storage..."
if ! wrangler r2 bucket list | grep -q "ai-voiceover-temp"; then
    echo "Creating R2 bucket..."
    wrangler r2 bucket create ai-voiceover-temp
fi

# Deploy to Cloudflare Workers
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your API is now running on Cloudflare's global edge network"
echo "📊 Monitor at: https://dash.cloudflare.com/"
echo "📝 Logs: wrangler tail"
echo ""
echo "🔗 Your edge API endpoints:"
echo "   Health: https://ai-voiceover-api.your-subdomain.workers.dev/health"
echo "   Voices: https://ai-voiceover-api.your-subdomain.workers.dev/api/voices"
