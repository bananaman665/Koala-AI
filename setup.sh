#!/bin/bash

# Koala.ai Development Environment Setup Script
# This script sets up the complete development environment

set -e

echo "🐨 Welcome to Koala.ai Setup"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js >= 18.x${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be >= 18.x (current: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

# Install MCP server dependencies
echo "Installing MCP server dependencies..."
cd mcp-server
npm install
cd ..

# Install shared dependencies
echo "Installing shared dependencies..."
cd shared
npm install
cd ..

# Install Firebase dependencies
echo "Installing Firebase dependencies..."
cd firebase
npm install
cd ..

echo ""
echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
echo ""

# Create .env files if they don't exist
echo "Setting up environment files..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env file. Please fill in your values.${NC}"
fi

if [ ! -f "client/.env.local" ]; then
    cp client/.env.example client/.env.local
    echo -e "${YELLOW}⚠️  Created client/.env.local file. Please fill in your values.${NC}"
fi

if [ ! -f "mcp-server/.env" ]; then
    cp mcp-server/.env.example mcp-server/.env
    echo -e "${YELLOW}⚠️  Created mcp-server/.env file. Please fill in your values.${NC}"
fi

echo ""
echo "🔥 Firebase Setup"
echo "=================="
echo "To complete Firebase setup, run:"
echo "  cd firebase"
echo "  firebase login"
echo "  firebase init"
echo ""

echo -e "${GREEN}✅ Development environment setup complete!${NC}"
echo ""
echo "📚 Next Steps:"
echo "=============="
echo "1. Fill in environment variables:"
echo "   - client/.env.local (Firebase config)"
echo "   - mcp-server/.env (OpenAI API key, Firebase Admin SDK)"
echo ""
echo "2. Set up Firebase project:"
echo "   - Create a new Firebase project at https://console.firebase.google.com"
echo "   - Enable Authentication (Email/Password)"
echo "   - Enable Firestore Database"
echo "   - Enable Storage"
echo "   - Download service account key for Admin SDK"
echo ""
echo "3. Get OpenAI API key:"
echo "   - Visit https://platform.openai.com/api-keys"
echo "   - Create a new API key"
echo "   - Add to mcp-server/.env"
echo ""
echo "4. Start development servers:"
echo "   npm run dev"
echo ""
echo "   Or individually:"
echo "   - Frontend: cd client && npm run dev"
echo "   - MCP Server: cd mcp-server && npm run dev"
echo ""
echo "Happy coding! 🚀"
