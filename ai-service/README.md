# Solana Trading AI Service

Python FastAPI microservice for ML-powered trade signal scoring.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST /predict
Get trade prediction for a token.

**Request Body:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "metadata": {
    "name": "USD Coin",
    "symbol": "USDC"
  }
}
```

**Response:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "model": "ml-signal-model-v1",
  "score": 85,
  "recommendation": "BUY",
  "confidence": 0.85
}
```

### GET /health
Health check endpoint.

### GET /
Service information.

## Integration

To enable the AI service in the main trading system:

1. Set environment variables in `.env`:
```
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_ENABLED=true
```

2. The prediction engine will automatically use the AI service when available, falling back to placeholder logic if the service is unavailable.

## Production Deployment

For production, replace the placeholder ML logic in `main.py` with your actual model inference code. Consider using:

- Pre-trained transformer models for text analysis
- Time series models for price prediction
- Graph neural networks for wallet relationship analysis
- Ensemble methods combining multiple signals

## Development

The service includes comprehensive logging and error handling. All predictions are logged for analysis and model improvement.