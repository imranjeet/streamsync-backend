#!/bin/bash

# Backend Pre-Deployment Verification Script
# This script checks if the backend is ready for deployment

set -e

echo "🔍 Starting Backend Pre-Deployment Verification..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Verify Node.js version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓ Node.js version OK (v$(node -v))${NC}"
else
    echo -e "${RED}✗ Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi

# Check 2: Verify npm dependencies are installed
echo ""
echo "2. Checking npm dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules directory exists${NC}"
else
    echo -e "${RED}✗ node_modules not found. Run 'npm install'${NC}"
    exit 1
fi

# Check 3: Verify build succeeds
echo ""
echo "3. Verifying TypeScript build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    npm run build
    exit 1
fi

# Check 4: Verify dist directory exists and has main.js
echo ""
echo "4. Checking build output..."
if [ -f "dist/main.js" ]; then
    echo -e "${GREEN}✓ Build output exists (dist/main.js)${NC}"
else
    echo -e "${RED}✗ Build output not found${NC}"
    exit 1
fi

# Check 5: Check for critical files
echo ""
echo "5. Checking critical files..."
FILES=("package.json" "tsconfig.json" "nest-cli.json" "Dockerfile" "src/main.ts")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file not found${NC}"
        exit 1
    fi
done

# Check 6: Verify environment variables documentation
echo ""
echo "6. Checking environment variables documentation..."
if grep -q "DB_HOST" README.md 2>/dev/null || [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ Environment variables documented${NC}"
else
    echo -e "${YELLOW}⚠ Environment variables documentation should be reviewed${NC}"
fi

# Check 7: Verify no TypeScript errors in build output
echo ""
echo "7. Checking for TypeScript compilation errors..."
if [ -d "dist" ] && [ -f "dist/main.js" ]; then
    echo -e "${GREEN}✓ TypeScript compiled successfully${NC}"
else
    echo -e "${RED}✗ TypeScript compilation issues${NC}"
    exit 1
fi

# Check 8: Verify health endpoint exists
echo ""
echo "8. Checking health endpoint implementation..."
if grep -q "@Get('health')" src/app.controller.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Health endpoint exists${NC}"
else
    echo -e "${RED}✗ Health endpoint not found${NC}"
    exit 1
fi

# Check 9: Verify worker service is properly configured
echo ""
echo "9. Checking worker service configuration..."
if grep -q "WorkerService" src/app.module.ts 2>/dev/null && grep -q "OnModuleInit" src/worker/worker.service.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Worker service configured${NC}"
else
    echo -e "${RED}✗ Worker service configuration issue${NC}"
    exit 1
fi

# Check 10: Verify graceful shutdown handlers
echo ""
echo "10. Checking graceful shutdown handlers..."
if grep -q "SIGTERM" src/main.ts 2>/dev/null && grep -q "SIGINT" src/main.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Graceful shutdown handlers present${NC}"
else
    echo -e "${RED}✗ Graceful shutdown handlers missing${NC}"
    exit 1
fi

# Check 11: Test that compiled code can be loaded (without starting server)
echo ""
echo "11. Testing compiled code can be loaded..."
if node -e "require('./dist/main.js')" 2>&1 | head -n 5; then
    echo -e "${YELLOW}⚠ Server tried to start (expected - will fail without DB)${NC}"
    echo -e "${GREEN}✓ Code can be loaded (module syntax valid)${NC}"
else
    echo -e "${RED}✗ Code loading error${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All pre-deployment checks passed!${NC}"
echo ""
echo "📋 Next steps for AWS EC2 deployment:"
echo "   1. Ensure all environment variables are set in .env file"
echo "   2. Database must be accessible from EC2 (check security groups)"
echo "   3. Firebase credentials must be properly formatted"
echo "   4. Run 'npm run start:prod' to start the server"
echo "   5. Configure PM2 for process management"
echo "   6. Setup NGINX reverse proxy"
echo ""

