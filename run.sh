#!/bin/bash
# Simple run script for local development

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing/updating dependencies..."
pip install -r requirements.txt

echo "Starting AI Voiceover Web App..."
echo "Access at: http://localhost:5000"
python app.py
