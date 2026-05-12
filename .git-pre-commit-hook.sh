#!/bin/bash
#=============================================================================
# PRE-COMMIT HOOK - Prevent committing sensitive files
#=============================================================================
# This hook prevents accidentally committing secrets to git
# 
# Installation:
#   1. Copy this file to: .git/hooks/pre-commit
#   2. Make it executable: chmod +x .git/hooks/pre-commit
#   3. Git will automatically run this before each commit
#
#=============================================================================

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

# Pattern of files that should never be committed
SENSITIVE_PATTERNS=(
    # Environment files
    '\.env$'
    '\.env\.local'
    '\.env\.production'
    '\.env\.staging'
    
    # Private keys
    '\.key$'
    '\.pem$'
    '\.ppk$'
    
    # Wallet & secrets
    'wallet\.json'
    'wallets\.json'
    'wallet\.secret\.json'
    'private_?keys?\.json'
    'secrets\.json'
    'credentials\.json'
    
    # Database dumps
    '\.dump$'
    '\.sql$'
    '\.backup$'
    
    # AWS/Cloud credentials
    '\.aws/credentials'
    '\.gcloud/credentials'
    '\.azure/credentials'
    
    # SSH/GPG keys
    '\.ssh/'
    '\.gnupg/'
    
    # SSL certificates (if private)
    '\.key$'
    '\.pem$'
    
    # Backups
    'backups/.*\.dump'
    'backups/.*\.sql'
    'backups/.*\.tar\.gz'
    
    # Build/compiled secrets
    'dist/.*\.json'
    'build/.*config'
)

# Get list of files being committed
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check against sensitive patterns
FOUND_SENSITIVE=false

while IFS= read -r file; do
    # Skip if file is deleted
    if [ ! -e "$file" ]; then
        continue
    fi
    
    # Check against all patterns
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if [[ "$file" =~ $pattern ]]; then
            echo -e "${RED}❌ SECURITY ERROR: Attempting to commit sensitive file!${NC}"
            echo -e "   File: ${RED}$file${NC}"
            echo -e "   Pattern: ${YELLOW}$pattern${NC}"
            echo ""
            echo "This file appears to contain sensitive information and is explicitly"
            echo "protected by .gitignore for security reasons."
            echo ""
            echo "If this is intentional, you can override with:"
            echo -e "  ${YELLOW}git commit --no-verify${NC} (NOT RECOMMENDED)"
            echo ""
            FOUND_SENSITIVE=true
        fi
    done
done <<< "$STAGED_FILES"

if [ "$FOUND_SENSITIVE" = true ]; then
    exit 1
fi

# Additional checks
echo -e "${GREEN}✓ Pre-commit hook: No sensitive files detected${NC}"

# Check for large files (more than 5MB)
echo ""
for file in $STAGED_FILES; do
    if [ -e "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        if [ "$size" -gt 5242880 ]; then  # 5MB
            echo -e "${YELLOW}⚠ WARNING: Large file detected: $file ($(($size / 1024 / 1024))MB)${NC}"
            echo "   Large files should be stored in LFS (Git Large File Storage)"
        fi
    fi
done

# Check for hardcoded credentials/API keys in code
echo ""
CRED_PATTERNS=(
    'apikey["\'':]'
    'api_key["\'':]'
    'password["\'':]'
    'secret["\'':]'
    'token["\'':]'
    'bearer["\'':]'
    'Authorization:["\'' ]'
    'private_key["\'':]'
)

# Only check JavaScript/TypeScript/Python files
CODE_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|jsx|tsx|py)$' || echo "")

FOUND_CREDS=false
if [ ! -z "$CODE_FILES" ]; then
    for pattern in "${CRED_PATTERNS[@]}"; do
        for file in $CODE_FILES; do
            if git diff --cached "$file" | grep -qi "$pattern"; then
                # This might be a false positive, so just warn
                echo -e "${YELLOW}⚠ WARNING: Potential hardcoded credentials in $file${NC}"
                echo "   Pattern: $pattern"
                FOUND_CREDS=true
            fi
        done
    done
fi

if [ "$FOUND_CREDS" = true ]; then
    echo ""
    echo -e "${YELLOW}Please verify these don't contain real credentials!${NC}"
    echo "If confirmed safe, use: ${YELLOW}git commit --no-verify${NC}"
    echo ""
fi

exit 0
