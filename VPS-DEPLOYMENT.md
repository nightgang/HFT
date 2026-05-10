# VPS Deployment Guide - HFT Trading System

## 📋 Pre-deployment Requirements

### Credentials & Secrets
- [ ] Generate new `JWT_SECRET` (32+ chars random)
- [ ] Generate new `API_KEY_SECRET` (32+ chars random)
- [ ] Generate new `ENCRYPTION_KEY` (32+ chars random)
- [ ] Generate strong database password
- [ ] Generate strong Redis password
- [ ] Prepare AWS credentials (if using S3 for backups)
- [ ] SSL certificate ready (Let's Encrypt or purchased)
- [ ] SSH keypair generated for VPS access

### Infrastructure
- [ ] VPS provisioned (Ubuntu 20.04+)
- [ ] Minimum specs: 2 CPU, 4GB RAM, 100GB SSD
- [ ] Domain name registered and DNS configured
- [ ] Firewall rules planned
- [ ] Backup storage prepared (AWS S3 or dedicated server)
- [ ] Monitoring system planned (Prometheus/Grafana)

### Documentation
- [ ] IP address of VPS
- [ ] SSH access credentials prepared
- [ ] Emergency contacts list prepared
- [ ] Incident response procedure drafted
- [ ] Rollback procedure documented

---

## 🚀 VPS Deployment Steps

### Phase 1: Initial VPS Setup (1-2 hours)

#### 1.1 Connect to VPS
```bash
# From local machine
ssh -i ~/.ssh/hft-vps.pem ubuntu@YOUR_VPS_IP

# Update system immediately
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y build-essential curl wget git vim
```

#### 1.2 Setup Security
```bash
# Disable password login (SSH key only)
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Setup firewall
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# Setup fail2ban
sudo apt-get install -y fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Setup automatic security updates
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### 1.3 Setup Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Phase 2: Database Setup (1-2 hours)

#### 2.1 PostgreSQL with Docker
```bash
# Create docker-compose.yml for database
mkdir -p ~/.hft/postgres
cat > ~/.hft/docker-compose.db.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: hft-postgres
    environment:
      POSTGRES_USER: hft_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hft_trading
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - hft-network
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hft_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: hft-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - hft-network
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:

networks:
  hft-network:
    driver: bridge
EOF

# Create environment file (NOT in git!)
cat > ~/.hft/.env.db << 'EOF'
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
REDIS_PASSWORD=YOUR_STRONG_PASSWORD_HERE
EOF

# Start services
cd ~/.hft
docker-compose -f docker-compose.db.yml --env-file .env.db up -d

# Verify services are running
docker ps
docker logs hft-postgres
docker logs hft-redis
```

#### 2.2 Initialize Database Schema
```bash
# Connect to PostgreSQL
docker exec -it hft-postgres psql -U hft_user -d hft_trading << 'EOF'
-- Create application user with limited permissions
CREATE ROLE trading_app WITH LOGIN PASSWORD 'APP_PASSWORD_HERE';

-- Grant permissions
GRANT CONNECT ON DATABASE hft_trading TO trading_app;
GRANT USAGE ON SCHEMA public TO trading_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO trading_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trading_app;

-- Set connection limits
ALTER ROLE trading_app CONNECTION LIMIT 10;

-- Enable password expiry
ALTER ROLE trading_app VALID UNTIL '2027-01-01';
EOF

# Run migrations (from repository)
# Copy init.sql and migrations to VPS first
docker exec hft-postgres psql -U hft_user -d hft_trading -f /docker-entrypoint-initdb.d/init.sql
```

### Phase 3: Application Deployment (2-3 hours)

#### 3.1 Clone & Prepare Repository
```bash
# Create application directory
mkdir -p /opt/hft-trading
cd /opt/hft-trading

# Clone repository (public fork or with deploy key)
git clone -b main https://github.com/YOUR_ORG/HFT.git .

# Verify .gitignore is working
git check-ignore -v .env
git check-ignore -v wallet.json
git check-ignore -v *.key
```

#### 3.2 Create Environment Files
```bash
# Create secure .env file (NOT committed!)
sudo cat > /opt/hft-trading/.env << 'EOF'
# Only showing critical secrets - see .env.example for all variables

NODE_ENV=production
BACKEND_PORT=3001
AI_SERVICE_PORT=8000

# Database
DB_HOST=hft-postgres
DB_USER=hft_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=hft_trading

# Redis
REDIS_HOST=hft-redis
REDIS_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Security
JWT_SECRET=GENERATE_NEW_RANDOM_VALUE_HERE
API_KEY_SECRET=GENERATE_NEW_RANDOM_VALUE_HERE
ENCRYPTION_KEY=GENERATE_NEW_RANDOM_VALUE_HERE

# RPC
RPC_URL=https://api.mainnet-beta.solana.com

# SSL
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
EOF

# Secure permissions
sudo chmod 600 /opt/hft-trading/.env
sudo chown ubuntu:ubuntu /opt/hft-trading/.env
```

#### 3.3 Create Docker Compose for Application
```bash
sudo cat > /opt/hft-trading/docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hft-backend
    env_file: .env
    ports:
      - "3001:3001"
    depends_on:
      hft-postgres:
        condition: service_healthy
      hft-redis:
        condition: service_healthy
    volumes:
      - ./backend/logs:/app/logs
      - ./backups:/app/backups
    networks:
      - hft-network
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: hft-ai-service
    env_file: .env
    ports:
      - "8000:8000"
    networks:
      - hft-network
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: hft-frontend
    ports:
      - "5173:5173"
    networks:
      - hft-network
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

  # Reverse proxy & SSL termination
  nginx:
    image: nginx:latest
    container_name: hft-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - frontend
    networks:
      - hft-network
    restart: always

networks:
  hft-network:
    driver: bridge
EOF

# Update docker-compose.db.yml reference
# Ensure both use same hft-network
```

#### 3.4 Setup Nginx as Reverse Proxy
```bash
sudo cat > /opt/hft-trading/nginx.conf << 'EOF'
upstream backend {
    server hft-backend:3001;
}

upstream frontend {
    server hft-frontend:5173;
}

upstream ai_service {
    server hft-ai-service:8000;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
    
    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # API endpoints
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # AI Service
    location /ai/ {
        proxy_pass http://ai_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF
```

#### 3.5 Build & Start Application
```bash
cd /opt/hft-trading

# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f frontend
```

### Phase 4: SSL/TLS Setup (30 minutes)

#### 4.1 Install Certbot for Let's Encrypt
```bash
sudo apt-get install -y python3-certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --email admin@your-domain.com \
  --agree-tos \
  -n

# Verify certificate
sudo certbot certificates

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

### Phase 5: Monitoring & Logging (1-2 hours)

#### 5.1 Setup Prometheus + Grafana
```bash
# Create prometheus config
mkdir -p /opt/hft-trading/monitoring
cat > /opt/hft-trading/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'hft-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'

  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']
EOF

# Start Prometheus
docker run -d \
  --name hft-prometheus \
  -p 9090:9090 \
  -v /opt/hft-trading/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro \
  -v prometheus_data:/prometheus \
  prom/prometheus

# Start Grafana
docker run -d \
  --name hft-grafana \
  -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD='YOUR_STRONG_PASSWORD' \
  -v grafana_storage:/var/lib/grafana \
  grafana/grafana
```

#### 5.2 Setup Backup Automation
```bash
# Create backup script
cat > /opt/hft-trading/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/hft-trading/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec hft-postgres pg_dump -U hft_user hft_trading | \
  gzip > $BACKUP_DIR/db-$(date +%H%M%S).sql.gz

# Backup Redis
docker exec hft-redis redis-cli --rdb $BACKUP_DIR/redis-$(date +%H%M%S).rdb

# Encrypt backups
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/*.gz
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/*.rdb

# Upload to S3 (if configured)
aws s3 sync $BACKUP_DIR s3://hft-backups/$(date +%Y/%m/%d)/ --sse AES256

# Delete local backups older than 7 days
find /opt/hft-trading/backups -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /opt/hft-trading/scripts/backup.sh

# Setup cron for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/hft-trading/scripts/backup.sh") | crontab -
```

### Phase 6: Verification & Testing (1-2 hours)

#### 6.1 Health Checks
```bash
# Check all services running
docker-compose ps

# Check database connectivity
docker exec hft-postgres psql -U hft_user -d hft_trading -c "SELECT 1"

# Check Redis connectivity
docker exec hft-redis redis-cli ping

# Check API health
curl https://your-domain.com/api/health

# Check AI service health
curl https://your-domain.com/ai/health

# Check frontend
curl https://your-domain.com/
```

#### 6.2 Security Verification
```bash
# Verify no secrets in running containers
docker exec hft-backend env | grep -E "PASSWORD|SECRET|KEY|TOKEN"
# Should only show safe values

# Verify SSL certificate
openssl s_client -connect your-domain.com:443

# Check firewall rules
sudo ufw status verbose

# Verify fail2ban is working
sudo fail2ban-client status sshd

# Check logs for errors
docker-compose logs --since 1h
```

---

## 📊 Post-deployment Operations

### Daily Checks
```bash
# Check all services are running
docker-compose ps

# Monitor logs for errors
docker-compose logs --since 1h | grep -i error

# Check disk space
df -h

# Check backup completion
ls -lh /opt/hft-trading/backups/
```

### Weekly Tasks
```bash
# Check updates available
sudo apt-get update && apt list --upgradeable

# Review security logs
sudo grep -i fail /var/log/auth.log

# Verify backup restoration works
# (practice restore to separate environment)

# Check certificate expiry
sudo certbot certificates
```

### Monthly Tasks
```bash
# Rotate credentials
# Update JWT_SECRET in .env
# Update database password
# Update API keys

# Security audit
# Review access logs
# Review service logs
# Update firewall rules if needed

# Test disaster recovery
# Full backup
# Full restore to test environment
```

---

## 🚨 Troubleshooting

### Services Not Starting
```bash
# Check logs
docker-compose logs backend

# Verify .env file
cat .env | grep -E "DB_|REDIS_|JWT"

# Check ports are available
sudo netstat -tupln | grep -E "3001|5173|8000|5432|6379"

# Rebuild images
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues
```bash
# Test connection
docker exec hft-backend node -e "
const pg = require('pg');
const client = new pg.Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
client.connect().then(() => console.log('Connected')).catch(console.error);
"

# Check database logs
docker logs hft-postgres

# Verify credentials
docker exec hft-postgres psql -U hft_user -d hft_trading -c "\du"
```

### SSL Certificate Issues
```bash
# Check certificate validity
openssl s_client -connect your-domain.com:443 -showcerts

# Renew certificate
sudo certbot renew --force-renewal

# Fix permissions
sudo chown -R ubuntu:ubuntu /etc/letsencrypt/live/

# Update docker-compose if needed
docker-compose restart nginx
```

---

## ✅ Final Deployment Checklist

- [ ] All services running and healthy
- [ ] SSL certificate installed and valid
- [ ] Database backups automated and tested
- [ ] Monitoring and alerting configured
- [ ] Security measures verified
- [ ] No secrets exposed in logs or git
- [ ] Access procedures documented
- [ ] Incident response procedures in place
- [ ] Team trained on operations
- [ ] Rollback procedure tested

---

**Deployment Date:**
**Deployed By:**
**Environment:** Production
**Version:** [commit hash]

