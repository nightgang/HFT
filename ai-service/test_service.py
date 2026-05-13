#!/usr/bin/env python3
"""
Test script for the Solana Trading AI Service
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
TEST_TIMEOUT = 10  # seconds

# Test data
USDC_TOKEN_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
TEST_PAYLOAD = {
    "tokenMint": USDC_TOKEN_MINT,
    "metadata": {
        "name": "USD Coin",
        "symbol": "USDC",
        "description": "USD Coin",
        "website": "https://www.centre.io/usdc",
        "age_days": 365,
        "holder_count": 100000
    },
    "marketData": {
        "price": 1.0,
        "liquidity": 5000000,
        "volume_24h": 1000000,
        "price_change_24h": 0.1
    }
}

RISK_TEST_PAYLOAD = {
    "tokenMint": USDC_TOKEN_MINT,
    "metadata": {
        "holder_count": 100000,
        "age_days": 365
    },
    "marketData": {
        "liquidity": 5000000,
        "price_change_24h": 0.1
    }
}

def test_health():
    """Test health endpoint"""
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health", timeout=TEST_TIMEOUT)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] == 2
    print("✓ Health check passed")

def test_root():
    """Test root endpoint"""
    print("Testing / endpoint...")
    response = requests.get(f"{BASE_URL}/", timeout=TEST_TIMEOUT)
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert "endpoints" in data
    print("✓ Root endpoint passed")

def test_predict():
    """Test predict endpoint"""
    print("Testing /predict endpoint...")
    payload = TEST_PAYLOAD

    response = requests.post(f"{BASE_URL}/predict", json=payload, timeout=TEST_TIMEOUT)
    assert response.status_code == 200
    data = response.json()

    required_fields = ["tokenMint", "model", "score", "recommendation", "confidence", "riskLevel", "features", "modelVersion"]
    for field in required_fields:
        assert field in data

    assert isinstance(data["score"], int)
    assert 0 <= data["score"] <= 100
    assert data["recommendation"] in ["BUY", "HOLD", "WATCH", "AVOID", "STRONG_BUY"]
    assert 0 <= data["confidence"] <= 1
    print(f"✓ Prediction: score={data['score']}, recommendation={data['recommendation']}, confidence={data['confidence']:.3f}")

def test_risk_assessment():
    """Test risk assessment endpoint"""
    print("Testing /risk-assessment endpoint...")
    payload = RISK_TEST_PAYLOAD

    response = requests.post(f"{BASE_URL}/risk-assessment", json=payload, timeout=TEST_TIMEOUT)
    assert response.status_code == 200
    data = response.json()

    required_fields = ["tokenMint", "riskScore", "riskFactors", "recommendation"]
    for field in required_fields:
        assert field in data

    assert isinstance(data["riskScore"], float)
    assert 0 <= data["riskScore"] <= 100
    assert data["recommendation"] in ["AVOID", "CONSIDER", "SAFE"]
    print(f"✓ Risk assessment: score={data['riskScore']}, recommendation={data['recommendation']}")

def main():
    """Run all tests"""
    print("Starting AI Service Tests...")
    print("=" * 50)

    try:
        test_health()
        test_root()
        test_predict()
        test_risk_assessment()

        print("=" * 50)
        print("🎉 All tests passed! AI Service is working correctly.")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())