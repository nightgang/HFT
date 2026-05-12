# AI Service Setup & Integration Guide

## Overview

The AI Service is a Python FastAPI microservice that provides ML-powered trade signal scoring and risk assessment for Solana tokens. It runs independently and integrates with the backend via HTTP API.

## System Requirements

- Python 3.10+
- pip (Python package manager)
- ~500MB disk space for dependencies
- 2GB+ RAM for model inference

## Installation

### Step 1: Install Python Dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

**Dependencies Include**:
- FastAPI - Web framework
- Pydantic - Data validation
- scikit-learn - ML models
- pandas - Data processing
- numpy - Numerical computing
- aiohttp - Async HTTP client

### Step 2: Verify Installation

```bash
python3 -c "import fastapi; import sklearn; import pandas; print('✓ All dependencies installed')"
```

## Running the AI Service

### Development Mode (Auto-reload)

```bash
cd ai-service
python3 main.py
# or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output**:
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check

```bash
curl http://localhost:8000/health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "ai-service",
  "timestamp": "2026-05-12T15:30:00Z"
}
```

### Trade Prediction

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "metadata": {
      "name": "USD Coin",
      "symbol": "USDC",
      "holders": 500000,
      "liquidity": 1000000
    }
  }'
```

### Risk Assessment

```bash
curl -X POST http://localhost:8000/risk-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "metadata": {
      "holders": 500000,
      "marketCap": 50000000,
      "liquidity": 1000000,
      "devWalletPercent": 5
    }
  }'
```

## Integration with Backend

### Enable AI Service in .env

```env
AI_SERVICE_ENABLED=true
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_PORT=8000
```

### Backend Configuration

The backend will automatically:
1. Check AI Service availability at startup
2. Cache predictions for 5 minutes
3. Fall back to rule-based scoring if AI service is unavailable
4. Log all AI service calls for monitoring

### Backend Integration Points

**Trading Decision Route**:
```javascript
GET /api/trading/ai-score/:tokenMint
```

Returns AI prediction score (0-100) and risk assessment.

## Models & Features

### Prediction Model

Uses ensemble machine learning to score trade opportunities:

**Input Features**:
- Token metadata (name, symbol, website, social links)
- Holder count and distribution
- Liquidity metrics
- Market cap
- Developer wallet concentration
- Community indicators

**Output**:
- Prediction score (0-100)
- Confidence level
- Key indicators

### Risk Assessment

Evaluates potential risks:

**Risk Categories**:
- Honeypot risk (transfer/exit restrictions)
- Liquidity risk (low trading volume)
- Developer risk (large dev wallet holdings)
- Market risk (volatility)
- Community risk (low holder count)

**Risk Score**: 0-100 (higher = more risky)

## Monitoring

### Check Service Status

```bash
curl http://localhost:8000/
```

### View Inference Logs

Logs are written to `ai-service/logs/` (if configured)

### Performance Metrics

- Average inference time: ~50-200ms per token
- Cache hit rate: ~70% (depends on token diversity)
- Memory usage: ~200-400MB

## Troubleshooting

### Service Won't Start

**Error**: `Port 8000 already in use`
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
```

**Error**: `ModuleNotFoundError`
```bash
# Verify dependencies
pip install -r requirements.txt
# Check Python version
python3 --version  # Should be 3.10+
```

### Slow Inference

- First request may be slow (model loading)
- Subsequent requests use caching
- Consider increasing workers in production

### Connection Refused

- Verify AI service is running on port 8000
- Check firewall/network settings
- Verify backend can reach `http://localhost:8000`

## Testing

### Run Service Tests

```bash
cd ai-service
pip install pytest pytest-asyncio pytest-cov
pytest tests/ -v
```

### Test Specific Endpoint

```bash
python3 -m pytest tests/test_predict.py::test_predict_usdc -v
```

### Performance Testing

```bash
pip install locust
locust -f tests/locustfile.py --host=http://localhost:8000
```

## Docker Deployment

### Build Image

```bash
docker build -f ai-service/Dockerfile -t hft-ai-service .
```

### Run Container

```bash
docker run -p 8000:8000 \
  -e MODEL_PATH=/app/models \
  hft-ai-service
```

### Docker Compose

```yaml
ai-service:
  build:
    context: .
    dockerfile: ai-service/Dockerfile
  ports:
    - "8000:8000"
  environment:
    - PYTHONUNBUFFERED=1
  networks:
    - hft-network
```

## Production Considerations

### Environment Variables

```env
AI_SERVICE_WORKERS=4          # Number of worker processes
AI_SERVICE_LOG_LEVEL=INFO     # Log level
AI_SERVICE_CACHE_TTL=300      # Cache time-to-live (seconds)
AI_SERVICE_TIMEOUT=30         # Request timeout
```

### Security

- Run behind reverse proxy (Nginx)
- Enable HTTPS/TLS
- Implement API key authentication
- Rate limit requests
- Validate input data

### Scaling

- Horizontal scaling: Run multiple containers behind load balancer
- Use Redis for distributed caching
- Monitor resource usage
- Set up auto-scaling rules

## Next Steps

1. **Start AI Service**: `python3 ai-service/main.py`
2. **Enable in Backend**: Set `AI_SERVICE_ENABLED=true` in .env
3. **Test Integration**: Call `/api/trading/ai-score/:tokenMint`
4. **Monitor Performance**: Check response times and accuracy
5. **Fine-tune Models**: Collect feedback and retrain periodically

---

**Last Updated**: May 12, 2026
**Status**: Ready for development and testing
