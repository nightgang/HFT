"""
Solana Trading AI Service
FastAPI service for AI-powered trading predictions and risk assessment.
"""

from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import random
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
import asyncio
import aiohttp
from datetime import datetime, timedelta
import json

# Constants
SERVICE_NAME = "Solana Trading AI Service"
SERVICE_VERSION = "2.0.0"
MODEL_DIR = "models"
JUPITER_API_URL = os.getenv("JUPITER_API_URL", "https://price.jup.ag/v4/price")
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))

# Model versions
MODEL_VERSIONS = {
    'rf_v2': '2.0.0',
    'gb_v2': '2.0.0'
}

# Common token symbols for training data
TOKEN_SYMBOLS = ["BONK", "WIF", "ORCA", "MNDE", "RAY", "MAGIC", "COPE", "DUST", "GST", "STEP"]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    # Startup
    load_models()
    yield
    # Shutdown
    pass

app = FastAPI(title="Solana Trading AI Service", version="2.0.0", lifespan=lifespan)

class PredictionRequest(BaseModel):
    tokenMint: str
    metadata: Optional[Dict[str, Any]] = {}
    marketData: Optional[Dict[str, Any]] = {}

class PredictionResponse(BaseModel):
    tokenMint: str
    model: str = "advanced-ml-signal-model-v2"
    score: int
    recommendation: str
    confidence: float
    riskLevel: str
    features: Dict[str, Any]
    modelVersion: str

class RiskAssessment(BaseModel):
    tokenMint: str
    riskScore: float
    riskFactors: List[str]
    recommendation: str

# Global models and encoders
models: Dict[str, Any] = {}
scalers: Dict[str, Any] = {}
encoders: Dict[str, Any] = {}

# Jupiter API for real market data
JUPITER_API_URL = "https://price.jup.ag/v4/price"

async def fetch_real_market_data(token_mint: str) -> Dict[str, Any]:
    """Fetch real market data from Jupiter API"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{JUPITER_API_URL}?ids={token_mint}") as response:
                if response.status == 200:
                    data = await response.json()
                    if token_mint in data.get('data', {}):
                        price_data = data['data'][token_mint]
                        return {
                            'price': float(price_data.get('price', 0)),
                            'market_cap': price_data.get('marketCap', 0),
                            'volume_24h': price_data.get('volume24h', 0),
                            'price_change_24h': price_data.get('priceChange24h', 0),
                            'liquidity': price_data.get('liquidity', 0)
                        }
    except Exception as e:
        logger.error(f"Failed to fetch market data for {token_mint}: {e}")

    return {
        'price': 0,
        'market_cap': 0,
        'volume_24h': 0,
        'price_change_24h': 0,
        'liquidity': 0
    }

def create_enhanced_training_data(num_samples: int = 2000) -> pd.DataFrame:
    """Create enhanced training data with more realistic patterns and features"""
    data = []

    # Expanded token categories
    token_categories = TOKEN_CATEGORIES

    symbols = TOKEN_SYMBOLS

    for _ in range(num_samples):
        # Select category and token
        category = random.choice(list(token_categories.keys()))
        token_names = token_categories[category]
        name = random.choice(token_names) if random.random() > 0.2 else f"Token{random.randint(1000,9999)}"
        symbol = random.choice(symbols) if random.random() > 0.3 else f"T{random.randint(100,999)}"

        # Enhanced feature generation
        name_length = len(name)
        symbol_length = len(symbol)
        has_description = 1 if random.random() > 0.15 else 0  # 85% have description
        has_website = 1 if random.random() > 0.2 else 0  # 80% have website
        has_twitter = 1 if random.random() > 0.25 else 0  # 75% have twitter
        has_telegram = 1 if random.random() > 0.3 else 0  # 70% have telegram
        has_github = 1 if random.random() > 0.6 else 0  # 40% have github

        # Market metrics
        age_days = random.randint(1, 365*2)  # Up to 2 years
        holder_count = random.randint(10, 500000)
        liquidity_usd = random.randint(1000, 5000000)

        # Price and volume with realistic distributions
        base_price = random.uniform(0.000001, 1.0)
        price_volatility = random.uniform(0.1, 2.0)
        volume_24h = random.randint(1000, liquidity_usd * 2)
        market_cap = holder_count * base_price * random.uniform(0.1, 10)

        # Social metrics
        twitter_followers = random.randint(0, 100000) if has_twitter else 0
        telegram_members = random.randint(0, 50000) if has_telegram else 0

        # Technical indicators
        price_change_24h = random.uniform(-50, 100)  # -50% to +100%
        price_change_7d = random.uniform(-80, 200)

        # Category encoding
        category_encoded = list(token_categories.keys()).index(category)

        # Calculate score based on comprehensive factors
        score = calculate_token_score({
            'category': category,
            'name_length': name_length,
            'has_description': has_description,
            'has_website': has_website,
            'has_twitter': has_twitter,
            'has_telegram': has_telegram,
            'has_github': has_github,
            'age_days': age_days,
            'holder_count': holder_count,
            'liquidity_usd': liquidity_usd,
            'market_cap': market_cap,
            'volume_24h': volume_24h,
            'price_change_24h': price_change_24h,
            'price_change_7d': price_change_7d,
            'twitter_followers': twitter_followers,
            'telegram_members': telegram_members,
            'price_volatility': price_volatility
        })

        data.append({
            'name': name,
            'symbol': symbol,
            'category': category_encoded,
            'name_length': name_length,
            'symbol_length': symbol_length,
            'has_description': has_description,
            'has_website': has_website,
            'has_twitter': has_twitter,
            'has_telegram': has_telegram,
            'has_github': has_github,
            'age_days': age_days,
            'holder_count': holder_count,
            'liquidity_usd': liquidity_usd,
            'market_cap': market_cap,
            'volume_24h': volume_24h,
            'price_change_24h': price_change_24h,
            'price_change_7d': price_change_7d,
            'twitter_followers': twitter_followers,
            'telegram_members': telegram_members,
            'price_volatility': price_volatility,
            'score': score
        })

    return pd.DataFrame(data)

def calculate_token_score(features: Dict[str, Any]) -> float:
    """Calculate token score based on comprehensive factors"""
    score = 50  # Base score

    # Metadata quality (0-20 points)
    metadata_score = 0
    if features['has_description']: metadata_score += 5
    if features['has_website']: metadata_score += 5
    if features['has_twitter']: metadata_score += 5
    if features['has_telegram']: metadata_score += 3
    if features['has_github']: metadata_score += 2
    if 4 <= features['name_length'] <= 12: metadata_score += 5
    score += min(metadata_score, 20)

    # Market maturity (0-20 points)
    maturity_score = 0
    if features['age_days'] > 30: maturity_score += 5
    if features['age_days'] > 90: maturity_score += 5
    if features['holder_count'] > 1000: maturity_score += 5
    if features['holder_count'] > 10000: maturity_score += 5
    score += min(maturity_score, 20)

    # Market activity (0-20 points)
    activity_score = 0
    if features['liquidity_usd'] > 50000: activity_score += 5
    if features['liquidity_usd'] > 200000: activity_score += 5
    if features['volume_24h'] > features['liquidity_usd'] * 0.1: activity_score += 5
    if features['market_cap'] > 1000000: activity_score += 5
    score += min(activity_score, 20)

    # Social proof (0-20 points)
    social_score = 0
    if features['twitter_followers'] > 1000: social_score += 5
    if features['twitter_followers'] > 10000: social_score += 5
    if features['telegram_members'] > 1000: social_score += 5
    if features['telegram_members'] > 10000: social_score += 5
    score += min(social_score, 20)

    # Momentum and volatility adjustments (-10 to +20 points)
    momentum_score = 0
    if features['price_change_24h'] > 10: momentum_score += 5
    if features['price_change_24h'] > 50: momentum_score += 5
    if features['price_change_7d'] > 20: momentum_score += 5
    if features['price_change_7d'] > 100: momentum_score += 5

    # Penalize extreme volatility
    if features['price_volatility'] > 1.5: momentum_score -= 5
    if features['price_volatility'] > 2.0: momentum_score -= 5

    score += momentum_score

    return max(0, min(100, score))

def train_advanced_models():
    """Train multiple advanced models for ensemble prediction"""
    global models, scalers, encoders

    logger.info("Training advanced ML models...")

    # Create enhanced training data
    df = create_enhanced_training_data(3000)

    # Prepare features
    feature_cols = [
        'category', 'name_length', 'symbol_length', 'has_description', 'has_website',
        'has_twitter', 'has_telegram', 'has_github', 'age_days', 'holder_count',
        'liquidity_usd', 'market_cap', 'volume_24h', 'price_change_24h',
        'price_change_7d', 'twitter_followers', 'telegram_members', 'price_volatility'
    ]

    X = df[feature_cols]
    y = df['score']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Random Forest
    rf_model = RandomForestRegressor(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_scaled, y_train)

    # Train Gradient Boosting
    gb_model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=8,
        learning_rate=0.1,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    gb_model.fit(X_train_scaled, y_train)

    # Evaluate models
    rf_pred = rf_model.predict(X_test_scaled)
    gb_pred = gb_model.predict(X_test_scaled)

    rf_mse = mean_squared_error(y_test, rf_pred)
    gb_mse = mean_squared_error(y_test, gb_pred)
    rf_r2 = r2_score(y_test, rf_pred)
    gb_r2 = r2_score(y_test, gb_pred)

    logger.info(f"Random Forest - MSE: {rf_mse:.2f}, R²: {rf_r2:.3f}")
    logger.info(f"Gradient Boosting - MSE: {gb_mse:.2f}, R²: {gb_r2:.3f}")

    # Store models
    models['rf_v2'] = rf_model
    models['gb_v2'] = gb_model
    scalers['v2'] = scaler

    # Save models
    os.makedirs('models', exist_ok=True)
    joblib.dump(rf_model, 'models/rf_model_v2.pkl')
    joblib.dump(gb_model, 'models/gb_model_v2.pkl')
    joblib.dump(scaler, 'models/scaler_v2.pkl')

    logger.info("Advanced models trained and saved")

def load_models():
    """Load trained models from disk"""
    global models, scalers

    try:
        if os.path.exists('models/rf_model_v2.pkl'):
            models['rf_v2'] = joblib.load('models/rf_model_v2.pkl')
            models['gb_v2'] = joblib.load('models/gb_model_v2.pkl')
            scalers['v2'] = joblib.load('models/scaler_v2.pkl')
            logger.info("Models loaded from disk")
        else:
            logger.info("No saved models found, training new ones...")
            train_advanced_models()
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        train_advanced_models()

def ensemble_predict(features: Dict[str, Any]) -> Dict[str, Any]:
    """Make ensemble prediction using multiple models"""
    if not models:
        load_models()

    # Prepare feature vector
    feature_vector = np.array([[
        features.get('category_encoded', 0),
        features.get('name_length', 5),
        features.get('symbol_length', 3),
        features.get('has_description', 0),
        features.get('has_website', 0),
        features.get('has_twitter', 0),
        features.get('has_telegram', 0),
        features.get('has_github', 0),
        features.get('age_days', 30),
        features.get('holder_count', 1000),
        features.get('liquidity_usd', 50000),
        features.get('market_cap', 100000),
        features.get('volume_24h', 10000),
        features.get('price_change_24h', 0),
        features.get('price_change_7d', 0),
        features.get('twitter_followers', 0),
        features.get('telegram_members', 0),
        features.get('price_volatility', 0.5)
    ]])

    # Scale features
    if 'v2' in scalers:
        feature_vector_scaled = scalers['v2'].transform(feature_vector)
    else:
        feature_vector_scaled = feature_vector

    # Get predictions from both models
    rf_pred = models['rf_v2'].predict(feature_vector_scaled)[0]
    gb_pred = models['gb_v2'].predict(feature_vector_scaled)[0]

    # Ensemble prediction (weighted average)
    ensemble_score = (rf_pred * 0.6) + (gb_pred * 0.4)

    # Calculate confidence based on prediction variance
    predictions = [rf_pred, gb_pred]
    confidence = max(0.1, 1.0 - (np.std(predictions) / 50))  # Lower variance = higher confidence

    return {
        'score': round(max(0, min(100, ensemble_score))),
        'confidence': round(confidence, 3),
        'rf_score': round(rf_pred, 1),
        'gb_score': round(gb_pred, 1)
    }

def assess_risk(token_data: Dict[str, Any]) -> Dict[str, Any]:
    """Assess trading risk for the token"""
    risk_factors = []
    risk_score = 0

    # Liquidity risk
    if token_data.get('liquidity_usd', 0) < 10000:
        risk_factors.append("Low liquidity")
        risk_score += 30
    elif token_data.get('liquidity_usd', 0) < 50000:
        risk_factors.append("Medium liquidity")
        risk_score += 15

    # Holder concentration risk
    if token_data.get('holder_count', 0) < 100:
        risk_factors.append("Few holders")
        risk_score += 25
    elif token_data.get('holder_count', 0) < 1000:
        risk_factors.append("Limited holders")
        risk_score += 10

    # Age risk
    if token_data.get('age_days', 0) < 7:
        risk_factors.append("Very new token")
        risk_score += 20
    elif token_data.get('age_days', 0) < 30:
        risk_factors.append("Recent token")
        risk_score += 10

    # Volatility risk
    if token_data.get('price_volatility', 0) > 1.0:
        risk_factors.append("High volatility")
        risk_score += 15
    elif token_data.get('price_volatility', 0) > 0.5:
        risk_factors.append("Moderate volatility")
        risk_score += 5

    # Price change risk
    price_change = token_data.get('price_change_24h', 0)
    if price_change > 200:
        risk_factors.append("Extreme price surge")
        risk_score += 25
    elif price_change > 100:
        risk_factors.append("High price momentum")
        risk_score += 15

    risk_level = "Low" if risk_score < 30 else "Medium" if risk_score < 60 else "High"

    return {
        'risk_score': min(100, risk_score),
        'risk_level': risk_level,
        'risk_factors': risk_factors
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_token_score(request: PredictionRequest):
    """Enhanced token score prediction with real market data"""
    try:
        token_mint = request.tokenMint
        metadata = request.metadata or {}
        market_data = request.marketData or {}

        # Fetch real market data if not provided
        if not market_data:
            market_data = await fetch_real_market_data(token_mint)

        # Prepare features
        features = {
            'category_encoded': 0,  # Default to meme token
            'name_length': len(metadata.get('name', '')),
            'symbol_length': len(metadata.get('symbol', '')),
            'has_description': 1 if metadata.get('description') else 0,
            'has_website': 1 if metadata.get('website') else 0,
            'has_twitter': 1 if metadata.get('twitter') else 0,
            'has_telegram': 1 if metadata.get('telegram') else 0,
            'has_github': 1 if metadata.get('github') else 0,
            'age_days': metadata.get('age_days', 30),
            'holder_count': metadata.get('holder_count', 1000),
            'liquidity_usd': market_data.get('liquidity', 50000),
            'market_cap': market_data.get('market_cap', 100000),
            'volume_24h': market_data.get('volume_24h', 10000),
            'price_change_24h': market_data.get('price_change_24h', 0),
            'price_change_7d': metadata.get('price_change_7d', 0),
            'twitter_followers': metadata.get('twitter_followers', 0),
            'telegram_members': metadata.get('telegram_members', 0),
            'price_volatility': metadata.get('price_volatility', 0.5)
        }

        # Get ensemble prediction
        prediction = ensemble_predict(features)

        # Assess risk
        risk_assessment = assess_risk(features)

        # Generate recommendation
        score = prediction['score']
        risk_level = risk_assessment['risk_level']

        if score >= 80 and risk_level == "Low":
            recommendation = "STRONG_BUY"
        elif score >= 70 and risk_level in ["Low", "Medium"]:
            recommendation = "BUY"
        elif score >= 50 and risk_level == "Low":
            recommendation = "HOLD"
        elif score >= 30:
            recommendation = "WATCH"
        else:
            recommendation = "AVOID"

        return PredictionResponse(
            tokenMint=token_mint,
            score=prediction['score'],
            recommendation=recommendation,
            confidence=prediction['confidence'],
            riskLevel=risk_level,
            features={
                'rf_score': prediction['rf_score'],
                'gb_score': prediction['gb_score'],
                'risk_factors': risk_assessment['risk_factors']
            },
            modelVersion="2.0.0"
        )

    except Exception as e:
        logger.error(f"Prediction failed for {request.tokenMint}: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/risk-assessment", response_model=RiskAssessment)
async def assess_token_risk(request: PredictionRequest):
    """Dedicated risk assessment endpoint"""
    try:
        token_mint = request.tokenMint
        metadata = request.metadata or {}
        market_data = request.marketData or {}

        if not market_data:
            market_data = await fetch_real_market_data(token_mint)

        features = {
            'liquidity_usd': market_data.get('liquidity', 50000),
            'holder_count': metadata.get('holder_count', 1000),
            'age_days': metadata.get('age_days', 30),
            'price_volatility': metadata.get('price_volatility', 0.5),
            'price_change_24h': market_data.get('price_change_24h', 0)
        }

        risk_assessment = assess_risk(features)

        recommendation = "AVOID" if risk_assessment['risk_level'] == "High" else "CONSIDER" if risk_assessment['risk_level'] == "Medium" else "SAFE"

        return RiskAssessment(
            tokenMint=token_mint,
            riskScore=risk_assessment['risk_score'],
            riskFactors=risk_assessment['risk_factors'],
            recommendation=recommendation
        )

    except Exception as e:
        logger.error(f"Risk assessment failed for {request.tokenMint}: {e}")
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": len(models),
        "version": "2.0.0"
    }

@app.get("/")
async def root():
    """Service information endpoint"""
    return {
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

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