#!/bin/bash

echo "Setting up Wine Tasting Event Backend..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Initialize database
echo "Initializing database..."
npm run init-db

echo "Backend setup complete!"
echo ""
echo "To start the backend server:"
echo "cd backend && npm run dev"
echo ""
echo "The server will run on http://localhost:3001"
