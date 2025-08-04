#!/bin/bash

# Manly Boat Hire Training Resource Launcher

echo "======================================"
echo "Manly Boat Hire - Training Resources"
echo "======================================"
echo ""

# Check if Python is installed
if command -v python3 &> /dev/null
then
    echo "Starting local web server..."
    echo "Opening training portal in browser..."
    echo ""
    echo "Training resources available at:"
    echo "- Main Training: http://localhost:8000/index.html"
    echo "- Quick Reference: http://localhost:8000/quick-reference.html"
    echo "- Vessel Diagram: http://localhost:8000/vessel-diagram.html"
    echo "- Interactive Map (Vessels & Anchorages): http://localhost:8000/vessel-locations-map.html"
    echo "- Simple Map (No API needed): http://localhost:8000/vessel-locations-map-simple.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Open in default browser based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open http://localhost:8000/index.html &
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open http://localhost:8000/index.html &
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        start http://localhost:8000/index.html &
    fi
    
    # Start the server
    python3 -m http.server 8000
else
    echo "Python 3 is not installed. Opening files directly in browser..."
    
    # Open directly in browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open index.html
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        start index.html
    fi
fi 