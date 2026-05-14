#!/bin/bash

# Load Testing Script for HFT System
# Tests API endpoints under simulated load

echo "🚀 Starting HFT System Load Test"
echo "================================="

BACKEND_URL="http://localhost:3001"
AI_URL="http://localhost:8000"

# Test 1: Health Check Performance
echo "📊 Testing Health Check Performance..."
time curl -s -o /dev/null -w "Health Check: %{time_total}s\n" $BACKEND_URL/health

# Test 2: AI Service Health
echo "🤖 Testing AI Service..."
time curl -s -o /dev/null -w "AI Health: %{time_total}s\n" $AI_URL/health

# Test 3: Concurrent Requests Simulation
echo "⚡ Testing Concurrent API Load..."
echo "Making 10 concurrent health check requests..."
for i in {1..10}; do
  curl -s $BACKEND_URL/health > /dev/null &
done
wait
echo "Concurrent requests completed"

# Test 4: Memory and CPU Check
echo "💾 Checking System Resources..."
docker stats --no-stream hft-backend hft-ai-service hft-postgres hft-redis

echo "✅ Load test completed!"
echo "📈 Check Grafana dashboard for detailed metrics"