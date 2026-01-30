#!/bin/bash

# Heroku post-build script
echo "Running Heroku post-build script..."

# Create necessary directories
mkdir -p data uploads

# Set permissions
chmod 755 data uploads

# Initialize empty reports.json if it doesn't exist
if [ ! -f data/reports.json ]; then
  echo "[]" > data/reports.json
fi

echo "Post-build script completed."
