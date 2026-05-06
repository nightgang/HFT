import { useState, useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

function SmartMoney() {
  const [trackedWallets, setTrackedWallets] = useState([]);
  const [smartSignals, setSmartSignals] = useState([]);
  const [walletInput, setWalletInput] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    fetchSmartSignals();
    const interval = setInterval(fetchSmartSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    wsRef.current = new ReconnectingWebSocket('ws://localhost:3002');

    wsRef.current.onopen = () => {
      console.log('Connected to smart money feed');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'SMART_MONEY_SIGNAL') {
          setSmartSignals((prev) => [message.data, ...prev].slice(0, 10));
        }
      } catch (error) {
        console.error('SmartMoney WS parse error:', error);
      }
    };

    return () => wsRef.current?.close();
  }, []);

  const fetchSmartSignals = async () => {
    try {
      const response = await fetch('http://localhost:3001/smart-money/signals?limit=5');
      const data = await response.json();
      if (Array.isArray(data.signals)) {
        setSmartSignals(data.signals);
      }
    } catch (error) {
      console.error('Smart signals fetch error:', error);
    }
  };

  const analyzeWallet = async () => {
    if (!walletInput.trim()) return;

    try {
      const response = await fetch(`http://localhost:3001/smart-money/${walletInput.trim()}`);
      const data = await response.json();
      setTrackedWallets((prev) => [data, ...prev]);
      setWalletInput('');
    } catch (error) {
      alert(`Error analyzing wallet: ${error.message}`);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-900/30';
    if (score >= 60) return 'text-yellow-400 bg-yellow-900/30';
    if (score >= 40) return 'text-gray-400 bg-gray-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6 text-purple-400">Smart Money Dashboard</h2>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            placeholder="Enter Solana wallet address"
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={analyzeWallet}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Track
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-400">Live Smart Signals 🐋</h3>
          {smartSignals.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No signals yet. Start the system to see live advisory input.</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {smartSignals.map((signal, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-400 truncate max-w-xs">
                      {signal.walletAddress || signal.tokenMint || 'Unknown'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(signal.smartSignalScore || signal.score)}`}>
                      {signal.smartSignalScore || signal.score}/100
                    </span>
                  </div>
                  <div className="text-white font-semibold">{signal.recommendation || 'HOLD'}</div>
                  <div className="text-xs text-gray-400 mt-1">Confidence: {Math.round((signal.confidence || 0) * 100)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-400">Tracked Wallets ({trackedWallets.length})</h3>
        {trackedWallets.length === 0 ? (
          <div className="text-gray-500 text-center py-8">Track wallets above to see analysis.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trackedWallets.map((wallet, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${getScoreColor(wallet.smartSignalScore || wallet.score)}`}>
                <div className="font-mono text-xs mb-2 truncate">
                  {wallet.walletAddress?.slice(0, 8)}...{wallet.walletAddress?.slice(-8)}
                </div>
                <div className="text-2xl font-bold mb-2">{wallet.smartSignalScore || wallet.score}</div>
                <div className="text-sm font-semibold mb-2">{wallet.recommendation}</div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Whale: {wallet.breakdown?.whaleDetection >= 10 || wallet.signals?.includes('WHALE_ACTIVITY') ? '✅' : '❌'}</div>
                  <div>ROI Score: {wallet.breakdown?.historicalROI || 0}</div>
                  <div>Accumulation: {wallet.breakdown?.accumulationPatterns || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartMoney;

