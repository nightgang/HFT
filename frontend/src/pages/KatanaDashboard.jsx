import { useState, useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

function KatanaDashboard() {
  const [katanaStatus, setKatanaStatus] = useState({
    isActive: false,
    activeTrades: 0,
    watchedTokens: 0,
    config: {}
  });

  const [positions, setPositions] = useState([]);
  const [pnlData, setPnlData] = useState({
    totalPnL: 0,
    totalInvested: 0,
    pnlPercentage: 0,
    activeTrades: 0
  });

  const [tokenFeed, setTokenFeed] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [riskAlerts, setRiskAlerts] = useState([]);

  const [selectedToken, setSelectedToken] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [slippage, setSlippage] = useState('0.3');

  const wsRef = useRef(null);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    // Initialize WebSocket connection for Katana
    const wsUrl = `ws://localhost:3003?token=${token}`;
    wsRef.current = new ReconnectingWebSocket(wsUrl, [], {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
    });

    wsRef.current.onopen = () => {
      console.log('Katana WebSocket connected');
      // Subscribe to relevant channels
      wsRef.current.send(JSON.stringify({
        type: 'SUBSCRIBE',
        channels: ['tokens', 'trades', 'pnl', 'risk']
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onerror = (error) => {
      console.error('Katana WebSocket error:', error);
    };

    // Load initial data
    loadKatanaStatus();
    loadPositions();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'TOKEN_DETECTED':
        setTokenFeed(prev => [data.data, ...prev.slice(0, 49)]); // Keep last 50
        break;
      case 'TRADE_UPDATE':
        setTradeHistory(prev => [data.data, ...prev.slice(0, 99)]); // Keep last 100
        break;
      case 'PNL_UPDATE':
        setPnlData(data.data);
        break;
      case 'RISK_ALERT':
        setRiskAlerts(prev => [data.data, ...prev.slice(0, 9)]); // Keep last 10
        break;
      case 'PRICE_UPDATE':
        // Update token prices in feed
        setTokenFeed(prev => prev.map(token =>
          token.mint === data.data.tokenMint
            ? { ...token, price: data.data.price, liquidity: data.data.liquidity }
            : token
        ));
        break;
      default:
        break;
    }
  };

  const loadKatanaStatus = async () => {
    try {
      const response = await fetch('/api/katana/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setKatanaStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load Katana status:', error);
    }
  };

  const loadPositions = async () => {
    try {
      const response = await fetch('/api/katana/positions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setPositions(result.data.positions);
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  const toggleKatana = async () => {
    try {
      const endpoint = katanaStatus.isActive ? 'stop' : 'start';
      const response = await fetch(`/api/katana/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setKatanaStatus(prev => ({ ...prev, isActive: !prev.isActive }));
      }
    } catch (error) {
      console.error('Failed to toggle Katana:', error);
    }
  };

  const executeTrade = async (side) => {
    if (!selectedToken || !tradeAmount) return;

    try {
      const response = await fetch('/api/katana/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          side,
          tokenMint: selectedToken.mint,
          amount: parseFloat(tradeAmount),
          slippage: parseFloat(slippage),
          useJito: false
        })
      });
      const result = await response.json();
      if (result.success) {
        setTradeAmount('');
        setSelectedToken(null);
      }
    } catch (error) {
      console.error('Failed to execute trade:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Katana Mode
              </h1>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                katanaStatus.isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {katanaStatus.isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Total PnL</div>
                <div className={`text-lg font-bold ${pnlData.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(pnlData.totalPnL)}
                </div>
              </div>
              <button
                onClick={toggleKatana}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  katanaStatus.isActive
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                }`}
              >
                {katanaStatus.isActive ? 'Stop Katana' : 'Start Katana'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Token Feed & Trading */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Feed */}
            <div className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-purple-400">Live Token Feed</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tokenFeed.map((token, index) => (
                  <div
                    key={`${token.mint}-${index}`}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedToken?.mint === token.mint
                        ? 'border-purple-400 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                    onClick={() => setSelectedToken(token)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{token.symbol || 'UNKNOWN'}</div>
                        <div className="text-sm text-gray-400">{token.mint.slice(0, 8)}...</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-300">
                          {token.price ? formatCurrency(token.price) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Liq: {token.liquidity ? `${token.liquidity.toFixed(1)} SOL` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {tokenFeed.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Waiting for token detections...
                  </div>
                )}
              </div>
            </div>

            {/* Trading Panel */}
            <div className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-purple-400">Trading Terminal</h2>

              {selectedToken ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Selected Token:</span>
                      <span className="font-medium text-white">{selectedToken.symbol || 'UNKNOWN'}</span>
                    </div>
                    <div className="text-sm text-gray-500">{selectedToken.mint}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Amount (SOL)</label>
                      <input
                        type="number"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Slippage (%)</label>
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                        placeholder="0.3"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => executeTrade('buy')}
                      disabled={!tradeAmount}
                      className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy Token
                    </button>
                    <button
                      onClick={() => executeTrade('sell')}
                      disabled={!tradeAmount}
                      className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sell Token
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a token from the feed to start trading
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Positions & Stats */}
          <div className="space-y-6">
            {/* PnL Stats */}
            <div className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-purple-400">Performance</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total PnL:</span>
                  <span className={`font-bold ${pnlData.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(pnlData.totalPnL)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">PnL %:</span>
                  <span className={`font-bold ${pnlData.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(pnlData.pnlPercentage)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Trades:</span>
                  <span className="font-bold text-white">{pnlData.activeTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Invested:</span>
                  <span className="font-bold text-white">{formatCurrency(pnlData.totalInvested)}</span>
                </div>
              </div>
            </div>

            {/* Active Positions */}
            <div className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-purple-400">Active Positions</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {positions.map((position, index) => (
                  <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{position.tokenMint?.slice(0, 8)}...</span>
                      <span className={`text-sm font-bold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(position.pnl)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Amount: {position.amount?.toFixed(4)} | Entry: {formatCurrency(position.entryPrice)}
                    </div>
                  </div>
                ))}
                {positions.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No active positions
                  </div>
                )}
              </div>
            </div>

            {/* Risk Alerts */}
            <div className="bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-purple-400">Risk Alerts</h2>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {riskAlerts.map((alert, index) => (
                  <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-sm font-medium text-red-400">{alert.alertType}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {alert.tokenMint?.slice(0, 8)}... - {alert.severity}
                    </div>
                  </div>
                ))}
                {riskAlerts.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No risk alerts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KatanaDashboard;