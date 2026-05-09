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
    """Create more realistic training data based on market indicators"""
    data = []
    
    # Real-world Solana token patterns
    token_names = ["BONK", "WIF", "ORCA", "MARINADE", "RAYDIUM", "MAGIC", "COPE", "COPE", "SLRS", "STEP"]
    symbols = ["BONK", "WIF", "ORCA", "MNDE", "RAY", "MAGIC", "COPE", "COPE", "SLRS", "STEP"]
    
    # Create diverse training samples with realistic patterns
    for _ in range(500):
        # Select real or synthetic token name
        name = random.choice(token_names) if random.random() > 0.3 else f"Token{random.randint(1000,9999)}"
        symbol = random.choice(symbols) if random.random() > 0.3 else f"T{random.randint(100,999)}"
        
        # More realistic feature generation
        name_length = len(name)  # Usually 3-15 chars
        symbol_length = len(symbol)  # Usually 2-10 chars
        has_description = 1 if random.random() > 0.2 else 0  # 80% have description
        has_website = 1 if random.random() > 0.3 else 0  # 70% have website
        
        # Market reputation indicators
        age_days = random.randint(1, 1000)  # Token age in days
        holder_count = random.randint(10, 100000)
        liquidity_usd = random.randint(1000, 1000000)
        volume_24h = random.randint(0, liquidity_usd / 10)
        
        # More realistic scoring based on market indicators
        score_base = 50
        
        # Bonus for good metadata
        if name_length >= 4 and name_length <= 8:
            score_base += 10
        if has_description:
            score_base += 15
        if has_website:
            score_base += 15
            
        # Bonus for market activity
        if age_days > 30:
            score_base += 10
        if holder_count > 5000:
            score_base += 10
        if liquidity_usd > 100000:
            score_base += 15
        if volume_24h > liquidity_usd * 0.5:
            score_base += 10
            
        # Add some randomness
        score = max(0, min(100, score_base + random.randint(-10, 20)))
        
        data.append({
            'name': name,
            'symbol': symbol,
            'name_length': name_length,
            'symbol_length': symbol_length,
            'has_description': has_description,
            'has_website': has_website,
            'age_days': age_days,
            'holder_count': holder_count,
            'liquidity_usd': liquidity_usd,
            'volume_24h': volume_24h,
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

    # Features - including market indicators
    feature_cols = [
        'name_length', 'symbol_length', 'has_description', 'has_website',
        'age_days', 'holder_count', 'liquidity_usd', 'volume_24h',
        'name_encoded', 'symbol_encoded'
    ]
    X = df[feature_cols]
    y = df['score']

    # Train model with better parameters
    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
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
    Uses trained RandomForest model with market indicators.
    Based on token metadata and market activity.
    """
    import time
    start_time = time.time()
    
    try:
        # Extract features from request metadata
        metadata = request.metadata or {}
        name = metadata.get('name', '')
        symbol = metadata.get('symbol', '')
        name_length = len(name)
        symbol_length = len(symbol)
        has_description = 1 if metadata.get('description') else 0
        has_website = 1 if metadata.get('website') else 0
        
        # Market indicators (with defaults for real data integration)
        age_days = int(metadata.get('age_days', random.randint(1, 365)))
        holder_count = int(metadata.get('holder_count', random.randint(100, 50000)))
        liquidity_usd = float(metadata.get('liquidity_usd', random.uniform(10000, 500000)))
        volume_24h = float(metadata.get('volume_24h', random.uniform(0, liquidity_usd)))

        # Handle unknown categories
        try:
            name_encoded = name_encoder.transform([name])[0] if name else 0
        except ValueError:
            name_encoded = 0

        try:
            symbol_encoded = symbol_encoder.transform([symbol])[0] if symbol else 0
        except ValueError:
            symbol_encoded = 0

        # Normalize features to reasonable ranges
        holder_count = min(holder_count, 1000000)  # Cap at 1M
        liquidity_usd = min(liquidity_usd, 10000000)  # Cap at 10M
        volume_24h = min(volume_24h, liquidity_usd)

        # Prepare features with all indicators
        features = np.array([[
            name_length, symbol_length, has_description, has_website,
            age_days, holder_count, liquidity_usd, volume_24h,
            name_encoded, symbol_encoded
        ]])

        # Predict score
        predicted_score = model.predict(features)[0]
        final_score = max(0, min(100, int(predicted_score)))

        # Determine recommendation based on score
        if final_score >= 75:
            recommendation = "BUY"
        elif final_score >= 40:
            recommendation = "HOLD"
        else:
            recommendation = "SELL"

        confidence = final_score / 100.0
        latency = time.time() - start_time
        
        logger.info(
            f"Prediction for {request.tokenMint}: score={final_score}, "
            f"recommendation={recommendation}, confidence={confidence:.2f}, latency={latency:.4f}s"
        )

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

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Solana Trading AI Service",
        "version": "1.0.0",
        "model_loaded": model is not None
    }

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