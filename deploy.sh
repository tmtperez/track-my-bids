#!/bin/bash

# Deployment script for track-my-bids on DigitalOcean
# This script pulls the latest changes, installs dependencies, runs migrations, and restarts the app

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to project directory
cd /var/www/track-my-bids/

echo -e "${BLUE}📥 Pulling latest changes from GitHub...${NC}"
git fetch origin
git reset --hard origin/main

echo -e "${BLUE}📦 Installing server dependencies...${NC}"
cd server
npm install

echo -e "${BLUE}📦 Installing client dependencies...${NC}"
cd ../client
npm install

echo -e "${BLUE}🗄️  Running database migrations...${NC}"
cd ../server
npx prisma generate
npx prisma migrate deploy

echo -e "${BLUE}🔨 Building client...${NC}"
cd ../client
npm run build

echo -e "${BLUE}🔄 Restarting application...${NC}"
cd ..

# Try different restart methods based on what's available
if command -v pm2 &> /dev/null; then
    echo "Restarting with PM2..."
    pm2 restart all
elif systemctl is-active --quiet track-my-bids; then
    echo "Restarting with systemctl..."
    sudo systemctl restart track-my-bids
else
    echo -e "${RED}⚠️  Could not automatically restart the app.${NC}"
    echo "Please restart your application manually."
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Your application should now be updated at your domain."
echo ""
echo "📝 Quick checks:"
echo "  - Check PM2 status: pm2 status"
echo "  - View logs: pm2 logs"
echo "  - Check service: systemctl status track-my-bids"
