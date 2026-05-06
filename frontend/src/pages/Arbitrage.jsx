import { useState, useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

function Arbitrage() {
  const [opportunities, setOpportunities] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const opportunitiesEndRef = useRef(null);

  useEffect(() => {
    wsRef.current = new ReconnectingWebSocket('ws://localhost:3002');

    wsRef.current.onopen = () => {
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ARBITRAGE_SIGNAL') {
          setOpportunities(prev => [message.data, ...prev.slice(0, 20)]);
        }
      } catch (error) {
        console.error('Arbitrage WS parse error:', error);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    opportunitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [opportunities]);

  const checkToken = async (tokenMint) => {
    try {
      const response = await fetch(`http://localhost:3001/arbitrage/check/${tokenMint}`);
      const data = await response.json();
      console.log('Arbitrage check:', data);
    } catch (error) {
      console.error('Arbitrage check error:', error);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-orange-400">Arbitrage Signals ⚡</h2>
          <span className={`px-3 py-1 rounded text-sm font-semibold ${isConnected ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>
            {isConnected ? '🟢 Live' : '🔴 Disconnected'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{opportunities.length}</div>
            <div className="text-sm text-gray-400">Live Signals</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{opportunities.filter(o => o.estimatedProfitPct > 1).length}</div>
            <div className="text-sm text-gray-400">>1% Profit</div>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Token mint for manual check"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const mint = e.target.value.trim();
                if (mint) checkToken(mint);
                e.target.value = '';
              }
            }}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-gray-500"
          />
          <button
            onClick={() => checkToken('So11111111111111111111111111111111111111112')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            Test WSOL
          </button>
        </div>

        <div className="bg-black border border-gray-700 rounded-lg h-96 overflow-y-auto font-mono text-sm">
          {opportunities.length === 0 ? (
            <div className="text-gray-500 text-center py-12 flex flex-col items-center">
              <div className="text-4xl mb-4">⚡</div>
              <div>No arbitrage opportunities detected</div>
              <div className="text-xs mt-2">Signals appear live when sniper is active</div>
            </div>
          ) : (
            opportunities.map((opp, index) => (
              <div key={index} className="p-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-xs text-gray-400 truncate max-w-xs">
                    {opp.tokenMint?.slice(0, 12)}...
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${opp.estimatedProfitPct > 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {opp.estimatedProfitPct?.toFixed(2)}%
                    </div>
                    <div className={`text-xs ${getRiskColor(opp.risk)}`}>
                      {opp.risk || 'MEDIUM'}
                    </div>
                  </div>
                </div>
                <div className="text-xs space-y-1 text-gray-400">
                  <div><span className="font-semibold">Type:</span> {opp.type}</div>
                  <div><span className="font-semibold">Buy:</span> {opp.buyDex} | <span className="font-semibold">Sell:</span> {opp.sellDex}</div>
                  <div className="font-mono text-xs">{opp.note}</div>
                  <div className="text-xs mt-2 text-gray-500">{new Date(opp.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
          <div ref={opportunitiesEndRef} />
        </div>
      </div>
    </div>
  );
}

export default Arbitrage;

