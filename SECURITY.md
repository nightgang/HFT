# Security Guide untuk VPS Deployment - HFT Trading System

## 📋 Daftar Isi
1. [Git Security](#git-security)
2. [Environment Secrets](#environment-secrets)
3. [VPS Security Setup](#vps-security-setup)
4. [Database Security](#database-security)
5. [Wallet & Private Keys](#wallet--private-keys)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Incident Response](#incident-response)

---

## 🔐 Git Security

### Critical: Never Commit
- ❌ `.env` files dengan real secrets
- ❌ Database backups/dumps
- ❌ Private keys atau wallet files
- ❌ API keys atau credentials
- ❌ Production data exports
- ❌ SSL certificates
- ❌ Sensitive logs

### Safe to Commit
- ✅ `.env.example` template
- ✅ `node_modules/` sudah di-ignore
- ✅ Build artifacts sudah di-ignore
- ✅ Database migration scripts (tanpa data)
- ✅ Public documentation

### Pre-commit Hook (Prevent Accidental Commits)

**File: `.git/hooks/pre-commit`**
```bash
#!/bin/bash

# Prevent committing sensitive files
SENSITIVE_FILES=(
    ".env"
    "*.key"
    "*.pem"
    "*.ppk"
    "wallet.json"
    "private_keys.json"
    "credentials.json"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if git diff --cached --name-only | grep -q "$file"; then
        echo "❌ ERROR: Attempting to commit sensitive file: $file"
        echo "This file is in .gitignore for security reasons."
        exit 1
    fi
done

exit 0
```

**Install Hook:**
```bash
chmod +x .git/hooks/pre-commit
```

### Verify .gitignore Applied
```bash
# Check if sensitive files are properly ignored
git check-ignore -v .env
git check-ignore -v wallet.json
git check-ignore -v backups/*.dump

# See all ignored files
git check-ignore -v -r .
```

---

## 🔑 Environment Secrets Management

### Option 1: Environment Variables (Simple)
```bash
# For development
export DB_PASSWORD="your_password"
export JWT_SECRET="your_jwt_secret"

# Load from file (but don't commit!)
set -a
source .env.local
set +a
```

### Option 2: AWS Secrets Manager (Recommended for VPS)
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
    --name hft/production \
    --secret-string file://secrets.json

# Retrieve in application
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

const getSecret = async () => {
    try {
        const response = await secretsManager.getSecretValue({
            SecretId: 'hft/production'
        }).promise();
        return JSON.parse(response.SecretString);
    } catch (error) {
        console.error('Failed to retrieve secret:', error);
    }
};
```

### Option 3: HashiCorp Vault (Enterprise)
```bash
# Install Vault
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install vault

# Setup Vault
vault secrets enable -version=2 kv
vault kv put secret/hft/production DB_PASSWORD="value" JWT_SECRET="value"

# Retrieve from application
const vault = require('node-vault')({
    endpoint: 'http://vault:8200',
    token: process.env.VAULT_TOKEN
});

const secrets = await vault.read('secret/data/hft/production');
```

### Best Practices
```bash
# ✅ DO
1. Rotate secrets regularly (monthly minimum)
2. Use different secrets for dev/staging/prod
3. Store in secure vault, NOT in code
4. Use short expiry for sensitive tokens
5. Monitor secret access logs

# ❌ DON'T
1. Hardcode secrets in application
2. Commit .env to git
3. Use same secrets across environments
4. Share credentials over unsecured channels
5. Keep secrets in plain text logs
```

---

## 🛡️ VPS Security Setup

### 1. SSH Hardening
```bash
# Generate SSH key (on local machine)
ssh-keygen -t ed25519 -f ~/.ssh/hft-vps -C "hft@trading"

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/hft-vps.pub user@vps-ip

# Edit SSH config on VPS
sudo nano /etc/ssh/sshd_config

# Key settings
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

### 2. Firewall Setup
```bash
# Install UFW (Uncomplicated Firewall)
sudo apt-get install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (CRITICAL: do this first!)
sudo ufw allow 22/tcp

# Allow application ports
sudo ufw allow 3001/tcp    # Backend API
sudo ufw allow 5173/tcp    # Frontend (if needed)
sudo ufw allow 8000/tcp    # AI Service
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 80/tcp      # HTTP (redirect to HTTPS)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### 3. Fail2Ban (Brute Force Protection)
```bash
# Install
sudo apt-get install fail2ban

# Configure SSH protection
sudo nano /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true

# Start service
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 4. Automatic Security Updates
```bash
# Enable unattended upgrades
sudo apt-get install unattended-upgrades

# Configure
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

Unattended-Upgrade::Packages {
    "security";
};

Unattended-Upgrade::Mail "admin@hft-trading.com";
```

---

## 🗄️ Database Security

### PostgreSQL Hardening
```sql
-- Strong password policy
ALTER ROLE hft_user WITH PASSWORD 'USE_STRONG_PASSWORD_HERE';

-- Create restricted user for application
CREATE ROLE trading_app WITH LOGIN PASSWORD 'APP_PASSWORD_HERE';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO trading_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trading_app;

-- Restrict superuser
ALTER ROLE hft_user WITH NOSUPERUSER;

-- Enable SSL connections
-- Edit: /etc/postgresql/13/main/postgresql.conf
# ssl = on
# ssl_cert_file = '/etc/ssl/certs/server.crt'
# ssl_key_file = '/etc/ssl/private/server.key'

-- pg_hba.conf for SSL enforcement
# "local"   all             all                                     trust
# "host"    all             all             127.0.0.1/32            md5
# "hostssl" all             all             0.0.0.0/0               md5

-- Enable connection limits
ALTER ROLE trading_app CONNECTION LIMIT 10;

-- Enable password expiry
ALTER ROLE trading_app VALID UNTIL '2027-01-01';
```

### Backup Security
```bash
# Encrypted backup script
#!/bin/bash
BACKUP_FILE="hft-db-$(date +%Y%m%d-%H%M%S).dump"
BACKUP_DIR="/backups/database"

# Create encrypted backup
pg_dump -U hft_user hft_trading | \
    gpg --symmetric --cipher-algo AES256 \
    > ${BACKUP_DIR}/${BACKUP_FILE}.gpg

# Upload to S3 (encrypted in transit)
aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE}.gpg \
    s3://hft-backups/db/ \
    --sse AES256 \
    --storage-class GLACIER

# Cleanup local backup
rm ${BACKUP_DIR}/${BACKUP_FILE}.gpg

# Delete old backups (retention: 30 days)
find ${BACKUP_DIR} -name "*.gpg" -mtime +30 -delete
```

---

## 🔑 Wallet & Private Keys

### CRITICAL: Never Store Private Keys on VPS!

**Option 1: Hardware Wallet (RECOMMENDED)**
```javascript
// Use hardware wallet via Ledger/Trezor
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const AppSolana = require("@ledgerhq/hw-app-solana").default;

const getHardwareWalletAddress = async () => {
    const transport = await TransportNodeHid.create();
    const appSolana = new AppSolana(transport);
    const result = await appSolana.getAddress("m/44'/501'/0'/0'");
    return result.address;
};
```

**Option 2: Multi-Signature Wallet**
```javascript
// Use multi-sig for critical operations
// Requires N-of-M signatures for trades above threshold

const executeSigningTransaction = async (transaction, signersRequired) => {
    const signers = await collectSignatures(transaction, signersRequired);
    
    for (const signer of signers) {
        const signature = await signer.sign(transaction);
        transaction.addSignature(signer.publicKey, signature);
    }
    
    return connection.sendTransaction(transaction);
};
```

**Option 3: Cold Storage (Air-gapped Machine)**
```bash
# Generate keys on air-gapped machine (no internet)
solana-keygen new --no-passphrase -o ./wallet.json

# Create signed transactions on air-gapped machine
# Transfer to online machine via USB (encrypted)
# Execute transaction on online machine

# Store wallet.json in encrypted vault
gpg --symmetric --cipher-algo AES256 wallet.json
# Keep passphrase in separate secure location
```

### Key Protection
```bash
# File permissions (Windows + Linux)
chmod 600 wallet.json
chmod 600 *.pem
chmod 600 *.key

# Encrypt sensitive files
gpg --symmetric --cipher-algo AES256 wallet.json
# This creates wallet.json.gpg

# On VPS, load only when needed
gpg --decrypt wallet.json.gpg > /tmp/wallet.json
# Then delete /tmp/wallet.json after use
shred -vfz -n 3 /tmp/wallet.json
```

---

## 📊 Monitoring & Alerts

### Real-time Security Monitoring
```javascript
// backend/middleware/security-audit.js
const auditLog = async (req, res, next) => {
    const auditEntry = {
        timestamp: new Date(),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.id,
        statusCode: res.statusCode,
        duration: Date.now() - req.startTime,
        sensitiveAction: detectSensitiveAction(req)
    };
    
    // Log all sensitive operations
    if (auditEntry.sensitiveAction) {
        await logToDatabase(auditEntry);
        await sendAlert(auditEntry);  // Alert admins
    }
    
    next();
};

const detectSensitiveAction = (req) => {
    const sensitivePatterns = [
        /trades\/execute/i,
        /wallet\/export/i,
        /settings\/update/i,
        /risk\/override/i
    ];
    return sensitivePatterns.some(p => p.test(req.path));
};
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt-get install htop iotop nethogs

# Setup systemd service alerts
# Edit: /etc/systemd/system/hft-backend.service
[Service]
Restart=on-failure
RestartSec=10s
StartLimitInterval=60s
StartLimitBurst=3

# Send alerts on service failure
OnFailure=notify-monitor@%i.service
```

### Prometheus Metrics (Security Focus)
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  scrape_timeout: 10s

scrape_configs:
  - job_name: 'hft-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

---

## 🚨 Incident Response

### If Credentials Are Leaked
```bash
# IMMEDIATE ACTIONS (first 15 minutes)
1. Rotate all compromised credentials
2. Revoke all active sessions/tokens
3. Update all connected services
4. Enable enhanced logging
5. Notify security team

# Short-term (within 1 hour)
6. Review access logs for unauthorized activity
7. Check all recent trades for suspicious activity
8. Verify wallet balances and recent transactions
9. Take snapshot of system state for forensics

# Follow-up (within 24 hours)
10. Full security audit
11. Post-mortem analysis
12. Update security procedures
13. Notify affected users (if applicable)
14. Enable 2FA on all accounts
```

### Emergency Disable Trading
```bash
# Quick disable for emergency
curl -X POST http://localhost:3001/api/admin/emergency-disable \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "X-Emergency-Key: $EMERGENCY_KEY"

# Clear all active positions
curl -X POST http://localhost:3001/api/admin/liquidate-all \
    -H "Authorization: Bearer $ADMIN_TOKEN"

# Backup database immediately
pg_dump -U hft_user hft_trading > ./emergency-backup-$(date +%s).sql
```

---

## ✅ Security Checklist for VPS Deployment

### Pre-deployment
- [ ] Generate all new credentials for production
- [ ] Review and update `.gitignore`
- [ ] Delete all old private keys/credentials
- [ ] Setup SSH key authentication (disable password login)
- [ ] Create `.env.example` template with placeholders
- [ ] Implement pre-commit hooks to prevent secret commits
- [ ] Setup secrets vault (AWS Secrets Manager or Vault)

### Deployment
- [ ] Setup firewall rules properly (UFW/iptables)
- [ ] Enable SSH hardening
- [ ] Enable database SSL/TLS
- [ ] Setup HTTPS with valid certificate (Let's Encrypt)
- [ ] Enable automated backups with encryption
- [ ] Setup monitoring and alerting
- [ ] Enable audit logging
- [ ] Install Fail2Ban for brute force protection
- [ ] Setup VPN/bastion host for VPS access

### Post-deployment
- [ ] Verify no secrets in git history
- [ ] Test backup restoration procedures
- [ ] Setup incident response procedures
- [ ] Create security runbooks
- [ ] Schedule regular security audits
- [ ] Implement automated security scanning
- [ ] Setup vulnerability management process
- [ ] Document all security procedures

### Ongoing
- [ ] Rotate credentials quarterly
- [ ] Review access logs weekly
- [ ] Patch systems weekly
- [ ] Security awareness training
- [ ] Penetration testing (quarterly)
- [ ] Compliance audits (if required)

---

## 📞 Emergency Contacts

**Security Incidents:** security@hft-trading.com
**System Admin:** sysadmin@hft-trading.com
**Incident Response:** +1-XXX-XXX-XXXX (24/7)

---

**Last Updated:** May 10, 2026
**Version:** 1.0
**Status:** ACTIVE
