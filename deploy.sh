#!/bin/bash

# Vercel Deployment Script for AI Interviewer
# This script automates the deployment process to Vercel

set -e  # Exit on error

echo "🚀 Starting Vercel Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing globally...${NC}"
    npm install -g vercel
fi

# Check for required environment variables
echo -e "${YELLOW}📋 Checking environment variables...${NC}"
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Warning: No .env or .env.local file found.${NC}"
    echo "Make sure to set up environment variables in Vercel dashboard:"
    echo "  - DATABASE_URL"

    echo "  - GEMINI_API_KEY"
    echo "  - RESEND_API_KEY"
    echo "  - RESEND_FROM_EMAIL"
    echo "  - NEXT_PUBLIC_APP_URL"
    echo ""
fi

# Ask for deployment type
echo -e "${YELLOW}Select deployment type:${NC}"
echo "1) Production (main branch)"
echo "2) Preview (current branch)"
read -p "Enter choice (1 or 2): " deploy_type

# Run build locally to catch errors early
echo -e "${YELLOW}🔨 Running local build check...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Local build successful!${NC}"
echo ""

# Deploy to Vercel
if [ "$deploy_type" == "1" ]; then
    echo -e "${YELLOW}🚀 Deploying to PRODUCTION...${NC}"
    vercel --prod
else
    echo -e "${YELLOW}🚀 Deploying PREVIEW...${NC}"
    vercel
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify environment variables in Vercel dashboard"
    echo "2. Check deployment logs for any issues"
    echo "3. Test the deployed application"
else
    echo -e "${RED}❌ Deployment failed. Check the error messages above.${NC}"
    exit 1
fi
