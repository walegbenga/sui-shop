#!/bin/bash

# Sui Contract Deployment Script
# Deploys Move contracts to Sui testnet using Docker

echo "🐳 Sui Shop - Contract Deployment"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Build Docker image with Sui CLI
echo -e "${BLUE}🔨 Building Sui deployment container...${NC}"
echo "   This will take 5-10 minutes (first time only)"
echo ""

docker-compose -f docker-compose-deploy.yml build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build container${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Container built successfully${NC}"
echo ""

# Run deployment container
echo -e "${BLUE}🚀 Starting deployment container...${NC}"
echo ""

docker-compose -f docker-compose-deploy.yml run --rm sui-deploy bash << 'DEPLOY_SCRIPT'

echo "📍 Inside deployment container"
echo ""

# Initialize Sui client if needed
if [ ! -f ~/.sui/sui_config/client.yaml ]; then
    echo "🔧 Initializing Sui client..."
    sui client
fi

# Create new wallet if needed
echo "👛 Setting up wallet..."
if ! sui client addresses | grep -q "0x"; then
    echo "📝 Creating new wallet address..."
    sui client new-address ed25519
fi

echo ""

# Switch to testnet
echo "🌐 Switching to testnet..."
sui client switch --env testnet

echo ""

# Show active address
echo "📍 Active wallet address:"
ACTIVE_ADDRESS=$(sui client active-address)
echo "   $ACTIVE_ADDRESS"
echo ""

# Request test tokens
echo "💰 Requesting test SUI tokens from faucet..."
echo "   This may take 10-20 seconds..."
sui client faucet

echo ""
sleep 5

# Check balance
echo "💵 Checking balance..."
sui client gas

echo ""

# Build contracts
echo "🔨 Building Move contracts..."
cd /contracts
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check your Move code."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Deploy
echo "🚀 Deploying to Sui testnet..."
echo "   Gas budget: 100000000 (0.1 SUI)"
echo ""

DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 2>&1)
DEPLOY_EXIT_CODE=$?

echo "$DEPLOY_OUTPUT"
echo ""

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    
    # Extract Package ID
    PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP 'packageId.*?0x[a-fA-F0-9]+' | grep -oP '0x[a-fA-F0-9]+' | head -1)
    
    if [ ! -z "$PACKAGE_ID" ]; then
        echo "📦 Package ID: $PACKAGE_ID"
        echo ""
        
        # Save to file
        echo "NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID" > /contracts/deployed_testnet.env
        echo "NEXT_PUBLIC_SUI_NETWORK=testnet" >> /contracts/deployed_testnet.env
        echo "DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /contracts/deployed_testnet.env
        
        echo "✅ Saved deployment info to: move/deployed_testnet.env"
        echo ""
    fi
    
    echo "📋 Next steps:"
    echo ""
    echo "1. Copy the Package ID above"
    echo ""
    echo "2. Update your frontend .env.local:"
    echo "   NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID"
    echo "   NEXT_PUBLIC_SUI_NETWORK=testnet"
    echo ""
    echo "3. Restart your frontend:"
    echo "   docker-compose restart frontend"
    echo ""
    echo "4. Your contracts are now live on Sui testnet! 🎉"
    echo ""
    
    # Show wallet address for reference
    echo "💡 Your wallet address (save this):"
    echo "   $ACTIVE_ADDRESS"
    echo ""
    echo "   Fund it here: https://faucet.testnet.sui.io"
    echo "   View on explorer: https://suiexplorer.com/?network=testnet"
    echo ""
else
    echo "❌ Deployment failed!"
    echo ""
    echo "Common issues:"
    echo "- Not enough gas (request more from faucet)"
    echo "- Move syntax errors (check build output)"
    echo "- Network issues (try again)"
    echo ""
fi

DEPLOY_SCRIPT

echo ""
echo -e "${GREEN}🏁 Deployment process complete${NC}"
echo ""

# Check if deployed_testnet.env was created
if [ -f move/deployed_testnet.env ]; then
    echo -e "${GREEN}✅ Deployment info saved!${NC}"
    echo ""
    echo "📄 Contents of move/deployed_testnet.env:"
    cat move/deployed_testnet.env
    echo ""
    echo -e "${YELLOW}💡 Copy these values to your frontend .env.local${NC}"
else
    echo -e "${YELLOW}⚠️  No deployment info found${NC}"
    echo "   Check the output above for any errors"
fi

echo ""
echo "✅ Done!"
