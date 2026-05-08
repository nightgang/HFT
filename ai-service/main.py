from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import random
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Solana Trading AI Service", version="1.0.0")

class PredictionRequest(BaseModel):
    tokenMint: str
    metadata: Optional[Dict[str, Any]] = {}

class PredictionResponse(BaseModel):
    tokenMint: str
    model: str = "ml-signal-model-v1"
    score: int
    recommendation: str
    confidence: float

# Global model and encoders
model = None
name_encoder = LabelEncoder()
symbol_encoder = LabelEncoder()
model_version = "v1.0.0"  # Model versioning

def create_dummy_training_data():
    """Create dummy training data for the ML model"""
    data = []
    for _ in range(1000):
        name = f"Token{random.randint(1,100)}"
        symbol = f"T{random.randint(1,50)}"
        name_length = len(name)
        symbol_length = len(symbol)
        has_description = random.choice([0, 1])
        has_website = random.choice([0, 1])
        # Simulate score based on features
        score = (name_length * 2 + symbol_length * 5 + has_description * 10 + has_website * 15 + random.randint(0, 50)) % 101
        data.append({
            'name': name,
            'symbol': symbol,
            'name_length': name_length,
            'symbol_length': symbol_length,
            'has_description': has_description,
            'has_website': has_website,
            'score': score
        })
    return pd.DataFrame(data)

def train_model():
    """Train the ML model"""
    global model, name_encoder, symbol_encoder
    logger.info("Training ML model...")

    df = create_dummy_training_data()

    # Encode categorical features
    name_encoder.fit(df['name'])
    symbol_encoder.fit(df['symbol'])

    df['name_encoded'] = name_encoder.transform(df['name'])
    df['symbol_encoded'] = symbol_encoder.transform(df['symbol'])

    # Features
    X = df[['name_length', 'symbol_length', 'has_description', 'has_website', 'name_encoded', 'symbol_encoded']]
    y = df['score']

    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Save model
    joblib.dump(model, 'model.pkl')
    joblib.dump(name_encoder, 'name_encoder.pkl')
    joblib.dump(symbol_encoder, 'symbol_encoder.pkl')

    logger.info("ML model trained and saved")

def load_model():
    """Load the ML model if exists"""
    global model, name_encoder, symbol_encoder
    try:
        model = joblib.load('model.pkl')
        name_encoder = joblib.load('name_encoder.pkl')
        symbol_encoder = joblib.load('symbol_encoder.pkl')
        logger.info("ML model loaded from disk")
    except FileNotFoundError:
        train_model()

# Load or train model on startup
load_model()

@app.post("/predict", response_model=PredictionResponse)
async def predict_trade(request: PredictionRequest):
    """
    ML-powered trade prediction endpoint.
    Uses trained RandomForest model for prediction.
    """
    import time
    start_time = time.time()
    
    try:
        # Extract features from request
        name = request.metadata.get('name', '') if request.metadata else ''
        symbol = request.metadata.get('symbol', '') if request.metadata else ''
        name_length = len(name)
        symbol_length = len(symbol)
        has_description = 1 if request.metadata and request.metadata.get('description') else 0
        has_website = 1 if request.metadata and request.metadata.get('website') else 0

        # Handle unknown categories
        try:
            name_encoded = name_encoder.transform([name])[0] if name else 0
        except ValueError:
            name_encoded = 0  # Unknown name

        try:
            symbol_encoded = symbol_encoder.transform([symbol])[0] if symbol else 0
        except ValueError:
            symbol_encoded = 0  # Unknown symbol

        # Prepare features
        features = np.array([[name_length, symbol_length, has_description, has_website, name_encoded, symbol_encoded]])

        # Predict score
        predicted_score = model.predict(features)[0]

        # Clip to 0-100
        final_score = max(0, min(100, int(predicted_score)))

        # Determine recommendation
        if final_score >= 75:
            recommendation = "BUY"
        elif final_score >= 40:
            recommendation = "HOLD"
        else:
            recommendation = "SELL"

        confidence = final_score / 100.0

        latency = time.time() - start_time
        
        logger.info(f"Prediction for {request.tokenMint}: score={final_score}, recommendation={recommendation}, latency={latency:.4f}s, features={features.tolist()}")

        return PredictionResponse(
            tokenMint=request.tokenMint,
            model="ml-signal-model-v1",
            score=final_score,
            recommendation=recommendation,
            confidence=round(confidence, 2)
        )

    except Exception as e:
        latency = time.time() - start_time
        logger.error(f"Prediction error for {request.tokenMint}: {str(e)}, latency={latency:.4f}s")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/model/version")
async def get_model_version():
    """Get current model version"""
    return {"version": model_version, "model": "ml-signal-model"}

@app.post("/abtest")
async def ab_test(request: PredictionRequest):
    """A/B testing endpoint - randomly assign model version"""
    import random
    version = random.choice(["A", "B"])
    # In production, this would route to different model versions
    # For now, both use the same model
    logger.info(f"A/B test: assigned version {version} for {request.tokenMint}")
    return {"version": version, "model": f"ml-signal-model-{version.lower()}"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Solana Trading AI Service",
        "version": "1.0.0",
        "model_version": model_version,
        "endpoints": {
            "POST /predict": "Get trade prediction for token",
            "GET /model/version": "Get current model version",
            "GET /model/info": "Get model information",
            "GET /health": "Health check"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)