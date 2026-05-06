import { useState, useEffect } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

function LiveFeed({ tokens, onTokenSelect }) {
  const [liveTokens, setLiveTokens] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new ReconnectingWebSocket('ws://localhost:3002');

    websocket.onopen = () => {
      console.log('Connected to live feed');
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'TOKEN_DETECTED') {
          setLiveTokens(prev => [message.data, ...prev.slice(0, 49)]); // Keep last 50
        }
      } catch (error) {
        console.error('Feed message parse error:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('Feed WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const displayTokens = liveTokens.length > 0 ? liveTokens : tokens;

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {displayTokens.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No tokens detected yet. Start the sniper to see live updates.
        </div>
      ) : (
        displayTokens.map(token => (
          <div
            key={token.mint}
            onClick={() => onTokenSelect(token)}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-green-400">{token.symbol || 'UNKNOWN'}</div>
                <div className="text-sm text-gray-400 truncate max-w-xs">{token.name || 'Unknown Token'}</div>
                <div className="text-xs text-gray-500 truncate">{token.mint}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-400">Supply: {(parseInt(token.supply || '0', 10) / Math.pow(10, token.decimals || 6)).toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {new Date(token.timestamp && token.timestamp > 1e12 ? token.timestamp : token.timestamp * 1000).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default LiveFeed;