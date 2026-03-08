#!/bin/bash

# Sui Shop - Docker Quick Start Script

echo "🐳 Sui Shop Docker Setup"
echo "========================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found!"
    echo "   Please install Docker Compose."
    exit 1
fi

echo "✅ docker-compose found"
echo ""

# Check if .env file exists in backend
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (using defaults)"
else
    echo "✅ backend/.env exists"
fi
echo ""

# Check if .env.local exists in frontend
if [ ! -f frontend/.env.local ]; then
    echo "📝 Creating frontend .env.local file..."
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local (using defaults)"
else
    echo "✅ frontend/.env.local exists"
fi
echo ""

echo "🚀 Starting Sui Shop..."
echo "   This may take 3-5 minutes on first run..."
echo ""

# Start Docker Compose
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if docker ps | grep -q "sui-shop-backend"; then
    echo "✅ Backend running"
else
    echo "❌ Backend failed to start"
    docker-compose logs backend
    exit 1
fi

if docker ps | grep -q "sui-shop-frontend"; then
    echo "✅ Frontend running"
else
    echo "❌ Frontend failed to start"
    docker-compose logs frontend
    exit 1
fi

echo ""
echo "🎉 Sui Shop is ready!"
echo ""
echo "📍 Access your app:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop everything:"
echo "   docker-compose down"
echo ""
echo "Happy testing! 🚀"
