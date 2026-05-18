# AI Service

Machine learning service for Solana trading predictions and risk assessment.

## Overview

This service provides AI-powered analysis for cryptocurrency trading decisions, including:

- Token scoring and recommendations (BUY/HOLD/AVOID)
- Risk assessment and factor analysis
- Real-time market data integration
- Machine learning model training and inference

## Architecture

- **Framework**: FastAPI (Python)
- **ML Models**: Random Forest, Gradient Boosting
- **Data Sources**: Jupiter API for market data
- **Models**: Pre-trained and stored in `models/` directory

## API Endpoints

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

### GET /
Service information and available endpoints.

### POST /predict
Get AI prediction for a token.

**Request:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "metadata": {
    "name": "USD Coin",
    "symbol": "USDC",
    "age_days": 365,
    "holder_count": 100000
  },
  "marketData": {
    "price": 1.0,
    "liquidity": 5000000,
    "volume_24h": 1000000
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
  "confidence": 0.92,
  "riskLevel": "Low",
  "features": {...},
  "modelVersion": "2.0.0"
}
```

### POST /risk-assessment
Get risk assessment for a token.

**Request:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "metadata": {
    "holder_count": 100000,
    "age_days": 365
  },
  "marketData": {
    "liquidity": 5000000
  }
}
```

**Response:**
```json
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "riskScore": 15.5,
  "riskFactors": ["Low liquidity", "High volatility"],
  "recommendation": "SAFE"
}
```

## Running the Service

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

Service will be available at `http://localhost:8000`

### Docker

```bash
# Build and run
docker build -t ai-service .
docker run -p 8000:8000 ai-service
```

### Testing

```bash
# Run test script
python test_service.py
```

## Model Training

The service includes automated model training with realistic synthetic data:

- **Features**: Token metadata, market metrics, social signals
- **Categories**: Meme, DeFi, Gaming, Utility, NFT tokens
- **Models**: Random Forest Regressor, Gradient Boosting Regressor

Models are saved to the `models/` directory and loaded on startup.

## Configuration

Environment variables:

- `MODEL_DIR`: Directory for model files (default: "models")
- `REDIS_HOST`: Redis host for the shared EventBus (default: `localhost`)
- `REDIS_PORT`: Redis port for the shared EventBus (default: `6379`)
- `REDIS_DB`: Redis database index for the shared EventBus (default: `0`)
- `REDIS_PASSWORD`: Optional Redis password for EventBus authentication
- `REDIS_URL`: Optional Redis connection URL (overrides `REDIS_HOST`/`REDIS_PORT`)
- `AI_SERVICE_API_KEY`: API key for secure backend access
- Service automatically loads models on startup

## Event Bus Integration

The AI service is built to participate in the shared realtime EventBus:

- subscribes to `token.detected` events from the backend engine
- processes token detection payloads and generates AI trading signals
- publishes predictions to `ai.prediction` on Redis Pub/Sub
- publishes tactical signals to `ai.signal` on Redis Pub/Sub
- uses the same Redis configuration as the backend and frontend

## Dependencies

- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **scikit-learn**: Machine learning
- **pandas/numpy**: Data processing
- **aiohttp**: Async HTTP client
- **joblib**: Model serialization

## Model Files

- `rf_model_v2.pkl`: Random Forest model
- `gb_model_v2.pkl`: Gradient Boosting model
- `scaler_v2.pkl`: Feature scaler

Models are versioned and include metadata for tracking performance.