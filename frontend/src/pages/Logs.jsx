import { useState, useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    wsRef.current = new ReconnectingWebSocket('ws://localhost:3002');

    wsRef.current.onopen = () => {
      setIsConnected(true);
      addLog('📡 Connected to trading engine', 'system');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        addLog(`Parse error: ${error.message}`, 'error');
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      addLog('📡 Disconnected from trading engine', 'system');
    };

    wsRef.current.onerror = (error) => {
      addLog(`WebSocket error: ${error.message}`, 'error');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addLog = (message, type = 'info', data = null) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
      data,
    };
    setLogs(prev => [...prev.slice(-999), logEntry]); // Keep last 1000 logs
  };

  const handleWebSocketMessage = (message) => {
    const timestamp = new Date(message.timestamp || message.serverTimestamp).toLocaleTimeString();

    switch (message.type) {
      case 'TOKEN_DETECTED':
        addLog(`🆕 Token detected: ${message.data.symbol} (${message.data.mint})`, 'token', message.data);
        break;
      case 'RISK_APPROVED':
        addLog(`✅ Risk approved for ${message.data.mint}`, 'success', message.data);
        break;
      case 'RISK_REJECTED':
        addLog(`❌ Risk rejected: ${message.data.reason}`, 'warning', message.data);
        break;
      case 'TRADE_EXECUTED':
        addLog(`💰 Trade executed: ${message.data.signature}`, 'success', message.data);
        break;
      case 'TRADE_FAILED':
        addLog(`💥 Trade failed: ${message.data.reason}`, 'error', message.data);
        break;
      case 'SMART_MONEY_SIGNAL':
        addLog(`🐋 Smart Money: ${message.data.walletAddress} (${message.data.smartSignalScore}) - ${message.data.recommendation}`, 'success', message.data);
        break;
      case 'ARBITRAGE_SIGNAL':
        addLog(`⚡ Arbitrage: ${message.data.tokenMint} (${message.data.estimatedProfitPct?.toFixed(2)}%)`, 'warning', message.data);
        break;
      case 'PROCESSING_ERROR':
        addLog(`🔥 Processing error: ${message.data.error}`, 'error', message.data);
        break;
      default:
        addLog(`📩 ${message.type}: ${JSON.stringify(message.data)}`, 'info', message.data);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'token': return 'text-blue-400';
      case 'system': return 'text-purple-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-orange-400">Live System Logs</h2>
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 rounded text-sm ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No logs yet. Start the system to see live updates.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="mb-1">
                <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                <span className={getLogColor(log.type)}>{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Showing last {logs.length} log entries. Auto-scroll enabled.
        </div>
      </div>
    </div>
  );
}

export default Logs;