#!/bin/bash

# This script builds and runs the Agent Manager application

echo "====================================="
echo "Agent Manager System - Build & Launch"
echo "====================================="

# Function to check if npm is installed
check_npm() {
  if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
  fi
}

# Function to handle development mode
run_dev() {
  echo "Starting in development mode..."
  npm run dev -- --host --port 8080
}

# Function to handle production mode
run_prod() {
  echo "Building for production..."
  npm run build
  
  echo "Starting production server..."
  npm run preview -- --host --port 8080
}

# Main script
check_npm

echo "Installing dependencies..."
npm install

# Ask user for mode
if [ "$1" == "--dev" ]; then
  run_dev
elif [ "$1" == "--prod" ]; then
  run_prod
else
  echo "Choose run mode:"
  echo "1) Development mode (live reload)"
  echo "2) Production mode (optimized build)"
  read -p "Enter choice [1-2]: " choice
  
  case $choice in
    1)
      run_dev
      ;;
    2)
      run_prod
      ;;
    *)
      echo "Invalid choice. Defaulting to development mode."
      run_dev
      ;;
  esac
fi

# The application should now be accessible at http://localhost:8080