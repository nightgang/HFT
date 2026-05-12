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

### GET /
Service information and available endpoints.

**Response:**
```json
{
  "service": "Solana Trading AI Service",
  "version": "2.0.0",
  "description": "ML-powered trade signal scoring for Solana tokens",
  "endpoints": {
    "POST /predict": "Get trade prediction for a token",
    "POST /risk-assessment": "Assess trading risk for a token",
    "GET /health": "Health check",
    "GET /": "Service information"
  }
}
```

### POST /predict
Get trade prediction for a token using ensemble ML models.

**Request Body:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "metadata": {
    "name": "USD Coin",
    "symbol": "USDC",
    "description": "USD Coin",
    "website": "https://www.centre.io/usdc",
    "twitter": "https://twitter.com/centre_io",
    "telegram": "https://t.me/centre_io",
    "github": "https://github.com/centre-io",
    "age_days": 365,
    "holder_count": 100000,
    "price_change_7d": 0.5,
    "price_volatility": 0.1
  },
  "marketData": {
    "price": 1.0,
    "market_cap": 10000000,
    "volume_24h": 1000000,
    "price_change_24h": 0.1,
    "liquidity": 5000000
  }
}
```

**Response:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "model": "advanced-ml-signal-model-v2",
  "score": 85,
  "recommendation": "BUY",
  "confidence": 0.85,
  "riskLevel": "Low",
  "features": {
    "rf_score": 86.2,
    "gb_score": 83.8,
    "risk_factors": []
  },
  "modelVersion": "2.0.0"
}
```

### POST /risk-assessment
Dedicated risk assessment endpoint for tokens.

**Request Body:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "metadata": {
    "holder_count": 100000,
    "age_days": 365,
    "price_volatility": 0.1
  },
  "marketData": {
    "liquidity": 5000000,
    "price_change_24h": 0.1
  }
}
```

**Response:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "riskScore": 15.0,
  "riskFactors": [],
  "recommendation": "SAFE"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": 2,
  "version": "2.0.0"
}
```

## Features

- **Ensemble ML Models**: Uses Random Forest and Gradient Boosting for robust predictions
- **Real-time Market Data**: Fetches live data from Jupiter API
- **Risk Assessment**: Comprehensive risk analysis based on multiple factors
- **Async Processing**: Handles concurrent requests efficiently
- **Comprehensive Scoring**: Considers metadata quality, market maturity, activity, and momentum

## Model Training

The service automatically trains ML models on startup using synthetic but realistic training data that simulates various token characteristics and market conditions.

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