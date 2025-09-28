#!/bin/bash

echo "🎉 Setting up Birthday Quiz - Party Quiz & Buzzer Game"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   Visit: https://nodejs.org/"
    echo "   Or use a version manager like nvm: https://github.com/nvm-sh/nvm"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Setup database
echo "🗄️ Setting up database..."
npx prisma migrate dev --name init

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup database"
    exit 1
fi

echo "✅ Database setup complete"

# Seed database
echo "🌱 Seeding database with sample data..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo "✅ Database seeded successfully"

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p public/uploads

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the server, run:"
echo "   npm run dev"
echo ""
echo "📱 Then open:"
echo "   - Main app: http://localhost:3000"
echo "   - Host console: http://localhost:3000/host"
echo "   - Sample room: http://localhost:3000/room/SAMPLE"
echo ""
echo "🎮 Default admin PIN: change_me"
echo "🎯 Sample room code: SAMPLE"
