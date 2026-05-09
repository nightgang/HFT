# Monitoring & Alerting Setup Guide

## System Overview

The HFT Trading System includes comprehensive monitoring with:
- **Prometheus**: Time-series metrics collection
- **Grafana**: Visualization and dashboarding
- **Custom Alerts**: Rule-based alerting

## Prometheus Configuration

### Scrape Jobs Configured

1. **Backend Application** (`hft-backend`)
   - Endpoint: `http://localhost:3001/metrics`
   - Interval: 10 seconds
   - Metrics: HTTP requests, latency, errors, trades

2. **PostgreSQL Database** (`postgres`)
   - Via postgres_exporter
   - Interval: 15 seconds
   - Metrics: Connections, queries, cache, replication

3. **Prometheus Self-Monitoring** (`prometheus`)
   - Endpoint: `http://localhost:9090`
   - Interval: 15 seconds

### Available Metrics

#### Backend Metrics
```
# HTTP Metrics
http_requests_total              - Total requests by method/endpoint
http_request_duration_seconds    - Request latency (histogram)
http_request_size_bytes          - Request size
http_response_size_bytes         - Response size

# Trading Metrics
trades_total                     - Total trades executed
trades_successful_total          - Successful trades
trades_failed_total              - Failed trades
trading_pnl_total                - Total P&L
trading_execution_time_ms        - Execution latency
trading_average_slippage         - Slippage percentage
trading_strategy_trades_total    - Trades by strategy

# System Metrics
process_cpu_seconds_total        - CPU time used
process_resident_memory_bytes    - Memory usage
nodejs_heap_size_bytes           - Node.js heap memory
nodejs_active_handles            - Active handles
nodejs_event_loop_lag_seconds    - Event loop lag
```

#### Database Metrics
```
pg_stat_statements_calls         - Query call count
pg_stat_statements_mean_time_ms  - Average query time
pg_stat_statements_max_time_ms   - Max query time
pg_connections_active            - Active connections
pg_connections_idle              - Idle connections
pg_stat_database_tup_returned    - Rows returned
pg_stat_database_tup_fetched     - Rows fetched
pg_cache_hit_ratio               - Cache hit percentages
pg_replication_lag_seconds       - Replication lag
```

## Grafana Dashboards

### Available Dashboards

#### 1. HFT System Overview
**Location**: `http://localhost:3000` → Dashboards → HFT System Overview

Shows:
- API request rate (5-minute rolling)
- API response latency (p95, p99 percentiles)
- Backend memory usage
- Backend CPU usage
- Service health status (backend & database)

**Refresh Rate**: 10 seconds

#### 2. Trading Performance Dashboard
**Location**: `http://localhost:3000` → Dashboards → Trading Performance

Shows:
- Trades executed (last hour)
- Win rate (24 hours)
- Top trading strategies
- Cumulative P&L by wallet
- Trade execution time
- Average slippage

**Refresh Rate**: 30 seconds

### Creating Custom Dashboards

1. **Access Grafana**
   ```
   URL: http://localhost:3000
   Default Username: admin
   Default Password: admin (change in production!)
   ```

2. **Add Data Source** (if needed)
   - Click Settings → Data Sources
   - Add Prometheus: `http://prometheus:9090`

3. **Create Dashboard**
   - Click "+" → Dashboard
   - Add panels with PromQL queries

### Essential PromQL Queries

```promql
# Request Rate
rate(http_requests_total[5m])

# Error Rate
rate(http_requests_total{status=~"5.."}[5m])

# Latency Percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Win Rate
(increase(trades_successful_total[24h]) / increase(trades_total[24h])) * 100

# Average P&L
avg(trading_pnl_total)

# Database Connections
pg_connections_active

# Memory Usage (MB)
process_resident_memory_bytes / 1024 / 1024

# CPU Usage (%)
rate(process_cpu_seconds_total[1m]) * 100
```

## Alerts & Thresholds

### Recommended Alert Rules

#### High Error Rate
```yaml
alert: HighErrorRate
expr: (rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])) > 0.05
for: 5m
severity: critical
```

#### High Latency
```yaml
alert: HighAPILatency
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
for: 5m
severity: warning
```

#### Service Down
```yaml
alert: ServiceDown
expr: up{job="hft-backend"} == 0
for: 1m
severity: critical
```

#### High Memory Usage
```yaml
alert: HighMemoryUsage
expr: (process_resident_memory_bytes / 1073741824) > 4
for: 5m
severity: warning
```

#### Database Connection Pool Exhausted
```yaml
alert: DBConnectionPoolExhausted
expr: pg_connections_active > 45
for: 2m
severity: critical
```

#### Slow Queries
```yaml
alert: SlowQueries
expr: pg_stat_statements_mean_time_ms > 1000
for: 10m
severity: warning
```

## Access & Credentials

### Prometheus
- **URL**: `http://localhost:9090`
- **Authentication**: None (configure as needed)

### Grafana
- **URL**: `http://localhost:3000`
- **Default Username**: `admin`
- **Default Password**: `admin` (⚠️ Change in production!)

### Production Security

1. **Change Grafana Admin Password**
   ```
   In Grafana UI: Settings → Admin → Change Password
   Or via API:
   curl -X PUT http://admin:admin@localhost:3000/api/user/password \
     -H "Content-Type: application/json" \
     -d '{"oldPassword":"admin","newPassword":"newSecurePassword"}'
   ```

2. **Enable Prometheus Authentication**
   - Add reverse proxy (nginx/caddy)
   - Implement Basic Auth

3. **Network Isolation**
   - Only expose Grafana (not Prometheus)
   - Use Docker network isolation

## Metrics Collection Intervals

| Component | Interval | Retention |
|-----------|----------|-----------|
| Backend Metrics | 10s | 15 days |
| Database Metrics | 15s | 15 days |
| System Metrics | 15s | 15 days |
| Aggregated Views | 1m | 1 year |

## Performance Tuning

### Prometheus Configuration
```yaml
global:
  scrape_interval: 10s        # Shorter for real-time visibility
  evaluation_interval: 15s    # Alert evaluation frequency
```

**Tips**:
- Reduce scrape_interval for critical metrics
- Use metric relabeling to drop unnecessary labels
- Set storage retention appropriate to disk space

### Grafana Optimization
```
dashboard_cache_age = 10s      # Dashboard refresh cache
metric_query_timeout = 30s     # Query timeout
max_concurrent_queries = 100   # Concurrent query limit
```

## Troubleshooting

### Metrics Not Appearing

1. **Check Prometheus Targets**
   ```
   URL: http://localhost:9090/targets
   Verify all jobs show "UP" status
   ```

2. **Verify Metrics Endpoint**
   ```bash
   curl http://localhost:3001/metrics
   # Should return prometheus-formatted metrics
   ```

3. **Check Prometheus Logs**
   ```bash
   docker logs hft-prometheus
   ```

### Dashboard Not Updating

1. Verify data source connectivity:
   - Grafana → Settings → Data Sources → Prometheus → Test

2. Check query syntax in browser console

3. Increase refresh rate (right side of dashboard)

### High Memory Usage

- Reduce retention period: `--storage.tsdb.retention.time=7d`
- Increase scrape_interval to reduce cardinality

## Maintenance & Best Practices

### Regular Tasks

1. **Daily**: Review error and latency dashboards
2. **Weekly**: Check disk space usage for metrics storage
3. **Monthly**:
   - Review and clean up obsolete metrics
   - Update alert thresholds based on SLA
   - Archive old dashboards

### Backup Strategy

```bash
# Backup Prometheus data
docker exec hft-prometheus tar czf /tmp/prometheus-backup.tar.gz /prometheus

# Backup Grafana
docker exec hft-grafana tar czf /tmp/grafana-backup.tar.gz /var/lib/grafana
```

### Disk Space Management

```bash
# Check prometheus data size
du -sh /var/lib/prometheus

# Cleanup old metrics (reduce retention)
# Edit prometheus.yml and restart
--storage.tsdb.retention.time=14d
```

## Monitoring Metrics by Use Case

### For Trading Operations
- Watch: Win rate, P&L, execution latency, slippage
- Alert on: Unusual trading patterns, high error rates

### For Infrastructure
- Watch: API latency, memory, CPU, error rates
- Alert on: Service down, high resource usage

### For Risk Management
- Watch: Trade failures, risk violations
- Alert on: Loss limits exceeded, anomalous trades

## Integration with External Services

### Alertmanager Integration
```yaml
# prometheus.yml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

### Slack Notifications
```yaml
# alertmanager.yml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#trading-alerts'
```

### PagerDuty Integration
```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

## Resource Recommendations

| Environment | CPU | Memory | Storage | Notes |
|-------------|-----|--------|---------|-------|
| Development | 0.5 | 512MB | 10GB | Single instance |
| Staging | 2 | 2GB | 50GB | Moderate load |
| Production | 4 | 4GB | 200GB+ | High availability setup |

---

**Last Updated**: May 2026
**Version**: 1.0
