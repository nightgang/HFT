import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';

function KatanaLiveFeed() {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    // Generate initial feed
    const initialFeed = [
      { id: 1, mint: 'RAYxxx...', symbol: 'RAY', liquidity: 45.2, mcap: '2.3M', time: '2:34 PM', status: 'new' },
      { id: 2, mint: 'PSAIxx...', symbol: 'PSAI', liquidity: 12.8, mcap: '850K', time: '2:32 PM', status: 'medium' },
      { id: 3, mint: 'WIFxxx...', symbol: 'WIF', liquidity: 8.5, mcap: '420K', time: '2:30 PM', status: 'low' },
    ];
    setFeed(initialFeed);

    // Simulate live updates
    const interval = setInterval(() => {
      setFeed(prev => {
        const newToken = {
          id: prev.length + 1,
          mint: `TKN${Math.random().toString(36).substr(2, 5).toUpperCase()}...`,
          symbol: `TKN${Math.floor(Math.random() * 9999)}`,
          liquidity: Math.random() * 50,
          mcap: Math.random() > 0.5 ? `${(Math.random() * 5).toFixed(1)}M` : `${(Math.random() * 900).toFixed(0)}K`,
          time: new Date().toLocaleTimeString().slice(0, -3),
          status: ['new', 'medium', 'low', 'risk'][Math.floor(Math.random() * 4)],
        };
        return [newToken, ...prev.slice(0, 5)];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    new: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    risk: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-500/20 flex items-center space-x-2">
        <TrendingUp className="w-4 h-4 text-purple-400" />
        <h3 className="font-bold text-white text-sm">LIVE TOKEN FEED</h3>
        <div className="ml-auto text-xs text-gray-500">{feed.length} tokens</div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-64 space-y-2 p-3">
        {feed.map(token => (
          <div key={token.id} className="p-3 bg-black/40 border border-purple-500/20 hover:border-purple-400/50 rounded-lg transition cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-mono font-bold text-white text-sm">{token.symbol}</div>
                <div className="text-xs text-gray-500">{token.mint}</div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded border ${statusColors[token.status]}`}>
                {token.status === 'new' && '🆕'}
                {token.status === 'medium' && '📊'}
                {token.status === 'low' && '⚠️'}
                {token.status === 'risk' && '🚨'} {token.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
              <div>
                <span className="text-gray-500">Liquidity</span>
                <div className="text-green-400 font-bold">{token.liquidity.toFixed(1)} SOL</div>
              </div>
              <div>
                <span className="text-gray-500">Market Cap</span>
                <div className="text-purple-400 font-bold">${token.mcap}</div>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Time</span>
                <div className="text-blue-400 font-mono text-xs font-bold">{token.time}</div>
              </div>
            </div>
            <button className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-xs font-bold rounded transition border border-purple-500/30">
              → SNIPE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KatanaLiveFeed;