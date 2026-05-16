import { useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

export const useWebSocket = (url, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const ws = new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      maxRetries: 10,
      ...options,
    });

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        setLastMessage(event.data);
      }
    };

    ws.onerror = (event) => {
      setError(event);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === "string" ? message : JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
  };
};

// Specialized hooks for different WebSocket endpoints
export const useTradeWebSocket = () => {
  return useWebSocket("ws://localhost:3000/ws/trades");
};

export const useMarketDataWebSocket = () => {
  return useWebSocket("ws://localhost:3000/ws/market-data");
};

export const useNotificationsWebSocket = () => {
  return useWebSocket("ws://localhost:3000/ws/notifications");
};

export const usePortfolioWebSocket = () => {
  return useWebSocket("ws://localhost:3000/ws/portfolio");
};