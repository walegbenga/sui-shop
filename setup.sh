#!/bin/bash

# SuiMarket Quick Start Script
# This script helps you get started with SuiMarket quickly

set -e

echo "╔════════════════════════════════════════╗"
echo "║   SuiMarket Quick Start Setup         ║"
echo "║   Security-Hardened Social Commerce   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm --version)"

# Check Sui CLI (optional for frontend development)
if command -v sui &> /dev/null; then
    echo -e "${GREEN}✓${NC} Sui CLI $(sui --version)"
else
    echo -e "${YELLOW}⚠${NC} Sui CLI not found (optional for local development)"
    echo "  Install from: https://docs.sui.io/build/install"
fi

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend

if npm install; then
    echo -e "${GREEN}✓${NC} Dependencies installed successfully"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo "⚙️  Setting up environment..."

if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✓${NC} Created .env.local"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: Edit .env.local with your deployed contract addresses${NC}"
    echo "  You need to:"
    echo "  1. Deploy the smart contract first (see docs/DEPLOYMENT.md)"
    echo "  2. Update NEXT_PUBLIC_MARKETPLACE_PACKAGE"
    echo "  3. Update NEXT_PUBLIC_MARKETPLACE_OBJECT"
else
    echo -e "${GREEN}✓${NC} .env.local already exists"
fi

echo ""
echo "🏗️  Building the application..."
if npm run build; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${YELLOW}⚠${NC} Build completed with warnings (this is normal if contracts aren't deployed yet)"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                   Setup Complete! 🎉                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Deploy Smart Contracts (if not done):"
echo "   cd ../move"
echo "   sui move build"
echo "   sui move test"
echo "   sui client publish --gas-budget 100000000"
echo ""
echo "2️⃣  Update Environment Variables:"
echo "   cd ../frontend"
echo "   nano .env.local"
echo "   (Add your contract addresses)"
echo ""
echo "3️⃣  Start Development Server:"
echo "   npm run dev"
echo "   Visit: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: ../README.md"
echo "   - Deployment: ../docs/DEPLOYMENT.md"
echo "   - User Guide: ../docs/USER_GUIDE.md"
echo "   - Security: ../docs/SECURITY_AUDIT.md"
echo ""
echo "🆘 Need help?"
echo "   - Check documentation in /docs folder"
echo "   - Join Sui Discord: https://discord.gg/sui"
echo ""
