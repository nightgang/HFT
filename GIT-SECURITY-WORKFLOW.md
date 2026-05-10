# Git Security Workflow untuk HFT Trading System

## 📌 Quick Start

### 1. Setup untuk Developer Baru
```bash
# Clone repository
git clone https://github.com/nightgang/HFT.git
cd HFT

# Setup git hooks (prevent accidental commits of secrets)
chmod +x .git-pre-commit-hook.sh
cp .git-pre-commit-hook.sh .git/hooks/pre-commit

# Setup local environment (NEVER commit .env!)
cp .env.example .env.local
# Edit .env.local dengan credentials lokal Anda

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Git Workflow Sebelum Commit
```bash
# Sebelum mulai development
git checkout -b feature/your-feature-name

# During development
git add .
git status  # Review changes

# Commit dengan message yang jelas
git commit -m "feat: add multi-exchange support"

# Push ke remote
git push origin feature/your-feature-name

# Buat Pull Request
# GitHub akan otomatis run security checks
```

---

## 🔍 Pre-commit Hook Workflow

### Apa yang Hook Lakukan?

**AUTOMATIC CHECKS:**
1. ❌ Prevent komit `.env` files
2. ❌ Prevent komit `wallet.json`, `private_keys.json`
3. ❌ Prevent komit `*.key`, `*.pem` files
4. ❌ Prevent komit database dumps/backups
5. ⚠️ Warn jika detect hardcoded secrets dalam code
6. ⚠️ Warn jika file terlalu besar (>5MB)

**JIKA HOOK MENDETEKSI SENSITIVE FILES:**
```
❌ SECURITY ERROR: Attempting to commit sensitive file!
   File: .env
   Pattern: \.env$

This file appears to contain sensitive information...
```

### Bypass Hook (ONLY IF ABSOLUTELY SURE!)
```bash
# Skip pre-commit hook (use with caution!)
git commit --no-verify

# But BETTER: Use staging to exclude sensitive files
git reset HEAD .env  # Unstage .env
git commit           # Will pass hook
```

---

## 📋 What Can/Cannot Be Committed

### ✅ SAFE TO COMMIT
```
✓ .env.example        - Template with placeholders
✓ *.js, *.ts, *.jsx   - Source code (without hardcoded secrets)
✓ *.json configs      - Config files (without credentials)
✓ package.json        - Dependencies list
✓ README.md           - Documentation
✓ SECURITY.md         - Security guide
✓ src/                - Application source
✓ db/migrations/      - Database migration scripts (schema only!)
✓ docker/             - Docker configuration
✓ k8s/                - Kubernetes configs (public)
```

### ❌ NEVER COMMIT
```
✗ .env               - Real environment variables
✗ .env.production    - Production credentials
✗ wallet.json        - Private keys
✗ *.key             - Private keys
✗ *.pem             - Certificates/keys
✗ backups/*.dump    - Database dumps
✗ backups/*.sql     - Database exports
✗ private_keys.json - Wallet private keys
✗ secrets.json      - Secrets
✗ credentials.json  - AWS/API credentials
✗ *.gpg             - Encrypted files with real keys
```

---

## 🔐 Safe Ways to Handle Secrets

### Option 1: Using Environment Files
```bash
# Create .env.local (auto-ignored by git)
DB_HOST=localhost
DB_PASSWORD=my_local_password
JWT_SECRET=dev_jwt_secret_here

# Load in development
npm run dev  # Automatically loads .env.local
```

### Option 2: Using .env.local at Different Locations
```bash
# Development local environment
.env.local                    <- git ignored

# Different developers can have different .env.local
# All are git ignored
```

### Option 3: Using Secrets Vault CLI
```bash
# For production/staging, use CLI tool
npm install -g hft-vault-cli

# Load secrets from vault
hft-vault load production

# Credentials loaded to memory, NOT written to disk
```

---

## 🚢 VPS Deployment Workflow

### Pre-deployment Verification

**Check No Secrets in Git History:**
```bash
# Verify before pushing to production
git log --all --oneline --diff-filter=D -- .env *.key wallet.json

# Should return nothing - if it does, file was previously committed!
# Option 1: Force push (if before public)
# Option 2: Use BFG Repo Cleaner (if already public)

git rev-list --all -- .env | wc -l  # Should be 0

# Check for accidentally committed secrets
git log -p -S "private_key" | head -20
```

### Deployment Checklist

```
PRE-DEPLOYMENT
[ ] All credentials removed from git history
[ ] No .env file in repository
[ ] .gitignore covers all sensitive files
[ ] Pre-commit hook installed on all developer machines
[ ] .env.example has all required variables (no real values!)
[ ] Database migrations don't contain sensitive data
[ ] SSH keys generated and configured
[ ] Firewall rules configured

DEPLOYMENT
[ ] Deploy using environment variable injection
[ ] Database encrypted and backed up
[ ] SSL certificates installed (not committed)
[ ] Monitoring and alerting enabled
[ ] Backup automation verified
[ ] Audit logging enabled

POST-DEPLOYMENT
[ ] Verify application running with injected secrets
[ ] Test backup/restore procedure
[ ] Verify no production data leaked
[ ] Document access procedures
[ ] Setup incident response process
```

---

## 🔄 GitHub Actions Security Scanning

### Automatic Checks on Push
```yaml
# File: .github/workflows/security.yml
name: Security Checks

on: [push, pull_request]

jobs:
  secrets-detection:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      # Detect secrets in code
      - name: TruffleHog Security Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --debug
      
      # Scan dependencies
      - name: Dependency Scanning
        run: |
          npm audit --audit-level=high
          
      # Check gitignore patterns
      - name: Verify .gitignore
        run: |
          # Fail if sensitive files could be committed
          git check-ignore -v .env *.key wallet.json
```

---

## 🛠️ Developer Workflow Example

### Day 1: Starting Feature Development
```bash
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/advanced-backtesting

# 3. Make changes
# ... editing files ...

# 4. Check what changed
git status  # Shows modified files
git diff    # Shows actual changes

# 5. Stage changes
git add src/services/backtesting.service.js
git add docs/backtest.md

# 6. Pre-commit hook runs automatically
# ✓ Checks no .env files
# ✓ Checks no wallet.json
# ✓ Checks no api keys
# ✓ Checks file sizes

# 7. If hook passes, commit
git commit -m "feat: add advanced backtesting with Sharpe ratio

- Implemented RSI, MACD, Bollinger Bands strategies
- Added risk metrics calculation
- Added visualization component

Fixes #123"

# 8. Push to remote
git push origin feature/advanced-backtesting

# 9. Create Pull Request on GitHub
# - Description includes what changed
# - Related issues referenced
# - Tests documented
```

### If Pre-commit Hook Blocks Commit
```bash
# Scenario: Accidentally tried to commit .env

# Error:
# ❌ SECURITY ERROR: Attempting to commit sensitive file!
#    File: .env

# Solution:

# Option 1: Unstage the file
git reset HEAD .env

# Option 2: Add .env to .gitignore if not already
echo ".env" >> .gitignore

# Option 3: Commit only safe files
git add src/features/
git add .gitignore
git commit -m "fix: core features"

# Verify .env is not staged
git status  # Should show .env as "not staged for commit"

# Commit again
git commit -m "feat: add new features"
```

---

## 🚨 If Secrets Are Accidentally Committed

### IMMEDIATE ACTIONS
```bash
# 1. STOP - Don't push to remote yet!

# 2. Undo the commit
git reset --soft HEAD~1  # Undo commit, keep changes staged

# 3. Unstage sensitive file
git reset HEAD .env
git reset HEAD wallet.json

# 4. Add to .gitignore
echo ".env" >> .gitignore
git add .gitignore

# 5. Commit only safe changes
git commit -m "feat: add features (sensitive files removed)"

# 6. Now safe to push
git push origin feature-branch
```

### If Already Pushed to Remote
```bash
# 1. Rotate all credentials immediately
# - Change database password
# - Regenerate JWT secret
# - Rotate API keys

# 2. Remove from git history using BFG
npm install -g bfg

# Create list of files to remove
echo "*.env" > remove.txt
echo "wallet.json" >> remove.txt

bfg --delete-files remove.txt /path/to/repo

# 3. Force push to remote (CAREFUL!)
git push --force-with-lease

# 4. Notify team to re-clone
# 5. Revoke any exposed credentials
# 6. Monitor for unauthorized access
```

---

## 📚 Useful Commands

### Check What Would Be Committed
```bash
# See staged changes
git diff --cached

# See all changes (staged + unstaged)
git diff

# See what will be committed
git status

# See file sizes being committed
git ls-files --debug | grep -v '^[^[]'
```

### Verify Sensitive Files Are Ignored
```bash
# Check specific files
git check-ignore -v .env
git check-ignore -v wallet.json
git check-ignore -v *.key

# Check all ignored patterns
git status --ignored
```

### View Git History for Sensitive Keywords
```bash
# Search commit content for keywords
git log -S "private_key" -p
git log -S "password" -p
git log -S "API_KEY" -p

# Search commit messages
git log --grep="secret" -p
git log --all -- .env  # Check if .env was ever commited
```

### Clean Up Accidentally Committed Secrets
```bash
# If detected, remove from history
git filter-branch --tree-filter 'rm -f .env' HEAD

# Then force push (dangerous!)
git push origin HEAD --force

# Better: Use BFG Repo Cleaner
bfg --delete-files .env --force
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin HEAD --force
```

---

## ✅ Pre-deployment Checklist

Before deploying to VPS:

```bash
# 1. Verify no secrets in history
git log --all --oneline --diff-filter=D -- .env *.key wallet.json
# Should output: (nothing)

# 2. Verify .gitignore is correct
git check-ignore -v .env .env.production wallet.json private_keys.json

# 3. Verify .env.example doesn't have real values
cat .env.example | grep -i "use_strong_password_here"
# Should find guide text, not real passwords

# 4. Check last commits don't have secrets
git log --oneline -10
# Review each commit

# 5. Final check before push
git diff origin/main --name-only | xargs git check-ignore -v
# Should not show sensitive files

# 6. OK to push to production!
git push origin main
```

---

## 📞 Get Help

**Questions about security?** Read SECURITY.md
**Git problems?** Run `git help <command>`
**Still stuck?** Ask team lead before committing!

---

**Last Updated:** May 10, 2026
**Version:** 1.0
