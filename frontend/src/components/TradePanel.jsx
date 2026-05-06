import { useState, useEffect } from 'react';

function TradePanel({ selectedToken }) {
  const [amount, setAmount] = useState('0.1');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictionError, setPredictionError] = useState(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);

  const handleBuy = async () => {
    if (!selectedToken) {
      alert('Please select a token first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/trade/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenMint: selectedToken.mint,
          amount: parseFloat(amount),
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Buy order submitted! Signature: ${result.signature}`);
      } else {
        alert(`Buy failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleSell = async () => {
    if (!selectedToken) {
      alert('Please select a token first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/trade/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenMint: selectedToken.mint,
          amount: parseFloat(amount),
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Sell order submitted! Signature: ${result.signature}`);
      } else {
        alert(`Sell failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!selectedToken) {
        setPrediction(null);
        setPredictionError(null);
        return;
      }

      setIsPredictionLoading(true);
      setPredictionError(null);

      try {
        const response = await fetch(`http://localhost:3001/prediction/${selectedToken.mint}`);
        const data = await response.json();

        if (data.success === false) {
          setPrediction(null);
          setPredictionError(data.error || 'Prediction unavailable');
        } else {
          setPrediction(data);
        }
      } catch (error) {
        setPrediction(null);
        setPredictionError(error.message);
      }

      setIsPredictionLoading(false);
    };

    fetchPrediction();
  }, [selectedToken]);

  return (
    <div className="space-y-4">
      {selectedToken ? (
        <div className="bg-gray-700 rounded-lg p-3 mb-4">
          <div className="text-sm text-gray-400">Selected Token</div>
          <div className="font-semibold text-green-400">{selectedToken.symbol || 'UNKNOWN'}</div>
          <div className="text-xs text-gray-500 truncate">{selectedToken.mint}</div>
        </div>
      ) : (
        <div className="bg-gray-700 rounded-lg p-3 mb-4 text-center text-gray-500">
          Select a token from the live feed
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-2">Amount (SOL for buy, tokens for sell)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          step="0.01"
          min="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleBuy}
          disabled={isLoading || !selectedToken}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          {isLoading ? 'Buying...' : 'Buy'}
        </button>
        <button
          onClick={handleSell}
          disabled={isLoading || !selectedToken}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          {isLoading ? 'Selling...' : 'Sell'}
        </button>
      </div>

      {selectedToken && (
        <div className="mt-4 bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-blue-300">Trade Prediction</h3>
              <p className="text-xs text-gray-400">Powered by the advisory signal engine</p>
            </div>
            <div className={`text-sm font-semibold ${prediction?.recommendation === 'BUY' ? 'text-green-400' : prediction?.recommendation === 'SELL' ? 'text-red-400' : 'text-yellow-400'}`}>
              {isPredictionLoading ? 'Loading...' : prediction?.recommendation || 'Unavailable'}
            </div>
          </div>

          {isPredictionLoading ? (
            <div className="text-sm text-gray-400">Fetching prediction...</div>
          ) : prediction ? (
            <div className="space-y-2 text-sm text-gray-300">
              <div>Score: <span className="font-semibold text-white">{prediction.score}/100</span></div>
              <div>Confidence: <span className="font-semibold">{Math.round((prediction.confidence || 0) * 100)}%</span></div>
              <div>Model: <span className="font-semibold">{prediction.model}</span></div>
              <div>Token: <span className="font-semibold">{prediction.metadataSummary?.symbol || selectedToken.symbol || 'N/A'}</span></div>
            </div>
          ) : (
            <div className="text-sm text-red-300">{predictionError || 'No prediction available'}</div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Trades are executed via Jupiter Aggregator with risk checks
      </div>
    </div>
  );
}

export default TradePanel;