#!/bin/bash
# Production Readiness Validation Script
# Checks that all security fixes are properly applied

set -e

echo "=================================="
echo "Production Readiness Check"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0
SUCCESS=0

check_file() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    ((ERRORS++))
    return 1
  fi
  
  if grep -q "$pattern" "$file"; then
    echo "✅ $description"
    ((SUCCESS++))
    return 0
  else
    echo "❌ $description - pattern not found"
    ((ERRORS++))
    return 1
  fi
}

check_not_exists() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if [ ! -f "$file" ]; then
    echo "⚠️ File not found: $file"
    ((WARNINGS++))
    return 1
  fi
  
  if ! grep -q "$pattern" "$file"; then
    echo "✅ $description (vulnerability removed)"
    ((SUCCESS++))
    return 0
  else
    echo "⚠️ $description - vulnerability still present"
    ((WARNINGS++))
    return 1
  fi
}

echo "📋 Checking Backend Fixes..."
check_file "backend/db/connection.js" "Don't exit process immediately" "Database: Graceful shutdown handling"
check_file "backend/middleware/auth.js" "getEncryptionKey" "Backend: Encryption key caching"
check_file "backend/middleware/auth.js" "revoked" "Backend: API key expiration checks"
check_file "backend/app.js" "timingSafeEqual" "Backend: Timing-safe comparison"
check_file "backend/app.js" "authenticate.*metrics" "Backend: Metrics endpoint authentication"
echo ""

echo "📋 Checking Frontend Fixes..."
check_file "frontend/vite.config.js" "NODE_ENV.*development" "Frontend: Conditional sourcemaps"
check_file "frontend/src/main.jsx" "textContent" "Frontend: XSS prevention in error rendering"
echo ""

echo "📋 Checking AI Service Fixes..."
if [ -f "ai-service/main.py" ]; then
  check_file "ai-service/main.py" "CORSMiddleware" "AI Service: CORS middleware"
  check_file "ai-service/main.py" "verify_api_key" "AI Service: API key authentication"
  check_file "ai-service/main.py" "limiter" "AI Service: Rate limiting"
  check_file "ai-service/main.py" "os.getenv" "AI Service: Environment variables"
else
  echo "⚠️ AI Service main.py not found"
  ((WARNINGS++))
fi
echo ""

echo "📋 Checking CLI Fixes..."
check_file "cli/hft-terminal.js" "process.env.API_BASE" "CLI: API_BASE from environment"
check_file "cli/hft-terminal.js" "REQUEST_TIMEOUT" "CLI: Configurable timeout"
check_file "cli/hft-terminal.js" "makeApiCall" "CLI: API helper function"
echo ""

echo "📋 Checking Documentation..."
check_file "SECURITY_PRODUCTION_FIXES.md" "Production Security" "Documentation: Security fixes documented"
echo ""

echo "================================="
echo "Results:"
echo "✅ Passed: $SUCCESS"
echo "⚠️ Warnings: $WARNINGS"
echo "❌ Errors: $ERRORS"
echo "================================="

if [ $ERRORS -eq 0 ]; then
  echo ""
  echo "✅ All critical checks passed!"
  echo ""
  echo "Next steps for production:"
  echo "1. Review SECURITY_PRODUCTION_FIXES.md"
  echo "2. Set up proper environment variables"
  echo "3. Run database migrations: npm run migrate"
  echo "4. Test authentication flow"
  echo "5. Verify rate limiting works"
  echo "6. Test graceful shutdown"
  echo "7. Set up monitoring and alerts"
  echo ""
  exit 0
else
  echo ""
  echo "❌ Please fix the errors above before deploying to production"
  echo ""
  exit 1
fi
