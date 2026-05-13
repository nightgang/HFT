# Deployment Guide

Complete guide to deploying the HFT Solana Trading System to production environments.

---

## 🚀 Deployment Overview

HFT supports multiple deployment models:

1. **Local Development**: Docker Compose (single machine)
2. **Staging**: Kubernetes cluster with monitoring
3. **Production**: Scaled Kubernetes with HA and DR
4. **Cloud**: AWS/GCP/Azure with managed services

---

## 🐳 Docker Setup

### Prerequisites

- Docker v20.10+
- Docker Compose v1.29+
- 4GB+ RAM available
- 20GB+ disk space

### Local Development with Docker Compose

#### 1. Configure Environment

Create `.env` file in project root:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=hft_user
DB_PASSWORD=secure_dev_password_change_in_production
DB_NAME=hft_trading
DB_POOL_SIZE=20

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=redis_password

# Solana
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
SOLANA_WS_ENDPOINT=wss://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# API Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Encryption
MASTER_ENCRYPTION_KEY=your_encryption_key_32_chars_min

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true

# Features
ENABLE_AI_SERVICE=false
ENABLE_JITO_BUNDLES=true
```

#### 2. Build and Start Services

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Verify services
docker-compose ps
```

Expected output:
```
NAME             STATUS              PORTS
hft-postgres     Up (healthy)        5432->5432
hft-redis        Up (healthy)        6379->6379
hft-prometheus   Up                  9090->9090
hft-grafana      Up                  3001->3001
hft-backend      Up                  3000->3000
hft-frontend     Up                  5173->5173
```

#### 3. Initialize Database

```bash
# Run migrations
npm run migrate

# Verify database
npm run migrate:status

# Seed initial data (optional)
# npm run seed
```

#### 4. Verify Installation

```bash
# Health check
curl http://localhost:3000/api/health

# Frontend
curl http://localhost:5173

# Database
psql -h localhost -U hft_user -d hft_trading -c "SELECT version();"

# Redis
redis-cli -h localhost ping
```

#### 5. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | N/A |
| Backend API | http://localhost:3000 | JWT Required |
| API Docs | http://localhost:3000/api-docs | N/A |
| Prometheus | http://localhost:9090 | N/A |
| Grafana | http://localhost:3001 | admin/admin |

---

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes 1.20+
- kubectl configured
- Helm 3.0+ (optional)
- Persistent storage class available

### 1. Create Namespace and Secrets

```bash
# Create namespace
kubectl create namespace hft

# Create secrets
kubectl create secret generic hft-secrets \
  --from-literal=db-password=prod_password \
  --from-literal=jwt-secret=prod_jwt_secret \
  --from-literal=encryption-key=prod_encryption_key \
  -n hft

# Create docker registry secret (if using private registry)
kubectl create secret docker-registry regcred \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat ~/key.json)" \
  -n hft
```

### 2. Create ConfigMap

```bash
# Create configuration
kubectl create configmap hft-config \
  --from-literal=NODE_ENV=production \
  --from-literal=LOG_LEVEL=info \
  --from-literal=SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com \
  -n hft
```

### 3. Deploy PostgreSQL

```bash
# Option 1: Deploy in-cluster PostgreSQL
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: hft
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: hft
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_USER
          value: hft_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: hft-secrets
              key: db-password
        - name: POSTGRES_DB
          value: hft_trading
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
          subPath: postgres
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: hft
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
EOF

# Option 2: Use managed database (RDS, Cloud SQL, etc.)
# Update connection string in ConfigMap
```

### 4. Deploy Redis

```bash
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: hft
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: hft
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  clusterIP: None
EOF
```

### 5. Deploy Backend

```bash
# Create backend deployment
kubectl apply -f k8s/backend-deployment.yml

# Scale replicas
kubectl scale deployment backend --replicas=3 -n hft

# Check status
kubectl get pods -n hft
kubectl describe pod <pod-name> -n hft

# View logs
kubectl logs deployment/backend -n hft --follow
```

Example backend-deployment.yml:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: hft
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: gcr.io/hft-project/backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3000"
        - name: DB_HOST
          value: postgres
        - name: DB_PORT
          value: "5432"
        - name: DB_USER
          value: hft_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: hft-secrets
              key: db-password
        - name: DB_NAME
          value: hft_trading
        - name: REDIS_URL
          value: redis://redis:6379
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: hft-secrets
              key: jwt-secret
        - name: MASTER_ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: hft-secrets
              key: encryption-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: logs
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: hft
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: metrics
```

### 6. Deploy Frontend

```bash
kubectl apply -f k8s/frontend-deployment.yml
```

### 7. Configure Ingress

```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hft-ingress
  namespace: hft
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - trading.example.com
    secretName: hft-tls
  rules:
  - host: trading.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
EOF
```

### 8. Setup Prometheus Monitoring

```bash
kubectl apply -f k8s/prometheus-deployment.yml

# Access Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n hft
# Visit: http://localhost:9090
```

### 9. Setup Grafana

```bash
kubectl apply -f k8s/grafana-deployment.yml

# Get admin password
kubectl get secret grafana-admin -n hft -o jsonpath='{.data.password}' | base64 -d

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n hft
# Visit: http://localhost:3000 (admin/password)
```

### 10. Database Migrations on K8s

```bash
# Run migration as one-off job
kubectl run migrate --image=gcr.io/hft-project/backend:latest \
  --rm -it --restart=Never \
  -n hft \
  -- npm run migrate

# Or use a Kubernetes Job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  namespace: hft
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: gcr.io/hft-project/backend:latest
        command: ["npm", "run", "migrate"]
        env:
        - name: DB_HOST
          value: postgres
        - name: DB_USER
          value: hft_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: hft-secrets
              key: db-password
      restartPolicy: Never
  backoffLimit: 3
EOF
```

---

## 🔧 PM2 Production Setup

### Install PM2

```bash
npm install -g pm2
```

### Configure PM2

Edit `backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'api-server',
      script: './index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      ignore_watch: ['logs', 'node_modules'],
      merge_logs: true
    },
    {
      name: 'worker',
      script: './services/worker.service.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ],
  deploy: {
    production: {
      user: 'deploy',
      host: 'trading.example.com',
      ref: 'origin/main',
      repo: 'git@github.com:nightgang/HFT.git',
      path: '/var/www/HFT',
      'post-deploy': 'npm install && npm run migrate && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### Deploy with PM2

```bash
# Start application
npm run pm2:start

# Monitor
pm2 status
pm2 monit

# View logs
pm2 logs

# Stop
npm run pm2:stop

# Restart
npm run pm2:restart

# Delete
npm run pm2:delete

# Save PM2 config
pm2 save

# Resurrect on reboot
pm2 startup
```

---

## 📦 Container Registry

### Build Docker Images

```bash
# Build backend
docker build -t gcr.io/hft-project/backend:1.0.0 backend/

# Build frontend
docker build -t gcr.io/hft-project/frontend:1.0.0 frontend/

# Build AI service (optional)
docker build -t gcr.io/hft-project/ai-service:1.0.0 ai-service/
```

### Push to Registry

```bash
# Authenticate with registry
gcloud auth configure-docker

# Push images
docker push gcr.io/hft-project/backend:1.0.0
docker push gcr.io/hft-project/frontend:1.0.0

# Tag as latest
docker tag gcr.io/hft-project/backend:1.0.0 gcr.io/hft-project/backend:latest
docker push gcr.io/hft-project/backend:latest
```

---

## 🔐 Security Hardening

### SSL/TLS Certificates

```bash
# Using Let's Encrypt with cert-manager
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.13.0/cert-manager.yaml

kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Network Policies

```bash
# Restrict traffic
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-netpol
  namespace: hft
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: hft
EOF
```

### Pod Security Policies

```bash
# Run as non-root
# Read-only root filesystem
# No privileged containers
# See k8s/pod-security-policy.yml
```

---

## 📊 Monitoring & Observability

### Prometheus Alerts

```bash
# Example alert rules
kubectl apply -f k8s/alerting-rules.yml
```

### Grafana Dashboards

Pre-built dashboards:
1. **Trading Dashboard**: Trade metrics, success rates, P&L
2. **System Dashboard**: CPU, memory, disk, network
3. **Application Dashboard**: API latency, error rates, throughput
4. **Blockchain Dashboard**: Solana network metrics, transaction costs

### Logging

```bash
# View logs from Kubernetes
kubectl logs -f deployment/backend -n hft

# Export logs to file
kubectl logs deployment/backend -n hft > backend.log

# Using ELK stack for centralized logging (optional)
# See monitoring/ directory for configuration
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
    tags: [ v* ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker images
      run: |
        docker build -t gcr.io/${{ secrets.GCP_PROJECT }}/backend:${{ github.sha }} backend/
        docker build -t gcr.io/${{ secrets.GCP_PROJECT }}/frontend:${{ github.sha }} frontend/
    
    - name: Push to GCR
      run: |
        docker push gcr.io/${{ secrets.GCP_PROJECT }}/backend:${{ github.sha }}
        docker push gcr.io/${{ secrets.GCP_PROJECT }}/frontend:${{ github.sha }}
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/backend backend=gcr.io/${{ secrets.GCP_PROJECT }}/backend:${{ github.sha }} -n hft
        kubectl rollout status deployment/backend -n hft
```

---

## 🔧 Troubleshooting

### Backend won't start

```bash
# Check logs
kubectl logs deployment/backend -n hft

# Check resource constraints
kubectl describe pod <pod-name> -n hft

# Check database connection
kubectl exec -it <pod-name> -n hft -- npm run migrate:status
```

### Database connection issues

```bash
# Check PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n hft
psql -h localhost -U hft_user -d hft_trading

# Check credentials
kubectl get secret hft-secrets -n hft -o yaml
```

### Performance degradation

```bash
# Check metrics
kubectl top nodes
kubectl top pods -n hft

# Check resource limits
kubectl get resourcequotas -n hft

# Scale up
kubectl scale deployment backend --replicas=5 -n hft
```

---

## 📋 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review approved
- [ ] Security scan completed
- [ ] Secrets configured
- [ ] Database migrations tested
- [ ] Backup created
- [ ] Monitoring alerts configured
- [ ] Rollback plan prepared
- [ ] Load testing completed
- [ ] Documentation updated

---

## 🚀 Deployment Process

### 1. Staging Deployment

```bash
# Deploy to staging
kubectl apply -f k8s/staging/ -n hft-staging

# Run tests
npm run test:integration

# Load testing
npm run test:load

# Verify monitoring
# Check Grafana dashboards
```

### 2. Production Deployment

```bash
# Blue-green deployment
kubectl create -f k8s/backend-deployment-blue.yml
kubectl create -f k8s/backend-deployment-green.yml

# Switch traffic to green
kubectl patch service backend -p '{"spec":{"selector":{"version":"green"}}}'

# Monitor for errors
kubectl logs -f deployment/backend-green -n hft

# Rollback if needed
kubectl patch service backend -p '{"spec":{"selector":{"version":"blue"}}}'
```

### 3. Post-Deployment

```bash
# Verify services
curl https://trading.example.com/api/health

# Check metrics
# Visit Grafana: https://grafana.example.com

# Monitor for 24 hours
# Track error rates, latency, resource usage
```

---

## 🔄 Rollback Procedure

```bash
# Immediate rollback
kubectl rollout undo deployment/backend -n hft

# Check status
kubectl rollout status deployment/backend -n hft

# View rollout history
kubectl rollout history deployment/backend -n hft
```

---

## 📈 Scaling Guidelines

### Horizontal Scaling

```bash
# Scale backend replicas
kubectl scale deployment backend --replicas=5 -n hft

# View horizontal pod autoscaler
kubectl get hpa -n hft

# Configure autoscaling
kubectl autoscale deployment backend --min=3 --max=10 --cpu-percent=70 -n hft
```

### Database Scaling

- Read replicas for scaling read operations
- Connection pooling (pg-pool)
- Query optimization
- Caching layer (Redis)

---

**Deployment Guide Last Updated**: 2026-05-13

See also:
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [TRADING_GUIDE.md](TRADING_GUIDE.md) - Trading features
