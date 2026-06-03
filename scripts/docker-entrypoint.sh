#!/bin/sh
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}======================================${NC}"
echo "${GREEN}  Starting VibeTools Application${NC}"
echo "${GREEN}======================================${NC}"
echo ""

# Main execution
main() {
    # Start the application
    echo "${GREEN}======================================${NC}"
    echo "${GREEN}  Starting Application Server${NC}"
    echo "${GREEN}======================================${NC}"
    echo ""
    
    # Execute the main command (passed as arguments)
    exec "$@"
}

# Run main function
main "$@"
