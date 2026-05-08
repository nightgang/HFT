import { useState, useEffect } from 'react';

function LiveFeed({ recentTrades = [] }) {
  const [liveFeed, setLiveFeed] = useState([
    { id: 1, type: 'price_update', symbol: 'SOL', price: 145.23, change: 0.45, timestamp: '14:35:42' },
    { id: 2, type: 'execution', symbol: 'JTO', action: 'BUY', size: 100, price: 2.34, timestamp: '14:35:38' },
    { id: 3, type: 'alert', message: 'High volatility detected on ORCA', level: 'warning', timestamp: '14:35:35' },
    { id: 4, type: 'price_update', symbol: 'COPE', price: 0.089, change: -0.12, timestamp: '14:35:30' },
    { id: 5, type: 'execution', symbol: 'ORCA', action: 'SELL', size: 50, price: 0.92, timestamp: '14:35:25' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveFeed(prev => {
        const newFeed = [...prev];
        newFeed.shift(); // Remove oldest
        
        const symbols = ['SOL', 'JTO', 'ORCA', 'COPE', 'DRIFT'];
        const newItem = {
          id: Date.now(),
          type: ['price_update', 'execution', 'alert'][Math.floor(Math.random() * 3)],
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          price: Math.random() * 100,
          change: (Math.random() - 0.5) * 2,
          action: Math.random() > 0.5 ? 'BUY' : 'SELL',
          size: Math.floor(Math.random() * 200),
          timestamp: new Date().toLocaleTimeString(),
        };
        
        return [...newFeed, newItem];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getItemColor = (item) => {
    if (item.type === 'alert') {
      return item.level === 'critical' ? 'text-red-400' : 'text-yellow-400';
    }
    if (item.type === 'execution') {
      return item.action === 'BUY' ? 'text-green-400' : 'text-red-400';
    }
    if (item.change > 0) return 'text-green-400';
    if (item.change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getIcon = (item) => {
    if (item.type === 'price_update') return '📊';
    if (item.type === 'execution') return item.action === 'BUY' ? '🟢' : '🔴';
    if (item.type === 'alert') return '⚠️';
    return '▸';
  };

  return (
    <div className="border border-purple-500/30 bg-purple-500/5 backdrop-blur-sm p-4 rounded-lg">
      <div className="text-sm text-purple-400 uppercase tracking-wider mb-4 font-bold">
        ~ Live Market Feed
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {liveFeed.map((item) => (
          <div
            key={item.id}
            className="text-xs p-2 rounded border border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-500/10 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className={`flex items-center space-x-2 ${getItemColor(item)}`}>
                  <span>{getIcon(item)}</span>
                  {item.type === 'price_update' && (
                    <>
                      <span className="font-bold">{item.symbol}</span>
                      <span>${item.price.toFixed(2)}</span>
                      <span className={item.change > 0 ? 'text-green-400' : 'text-red-400'}>
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                      </span>
                    </>
                  )}
                  {item.type === 'execution' && (
                    <>
                      <span className="font-bold">{item.action}</span>
                      <span>{item.size} {item.symbol}</span>
                      <span>@ ${item.price.toFixed(2)}</span>
                    </>
                  )}
                  {item.type === 'alert' && (
                    <span>{item.message}</span>
                  )}
                </div>
              </div>
              <span className="text-gray-500 ml-4">{item.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(168, 85, 247, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  );
}

export default LiveFeed;
