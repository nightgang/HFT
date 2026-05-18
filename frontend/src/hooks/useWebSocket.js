import { useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

const getWebSocketUrl = (path = "/ws") => {
  if (typeof window === "undefined") return null;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const defaultPort = import.meta.env.VITE_WS_PORT || "3002";
  const host = import.meta.env.VITE_WS_HOST || window.location.hostname;
  const wsHost = `${protocol}//${host}:${defaultPort}`;

  return `${wsHost}${path}`;
};

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
  return useWebSocket(getWebSocketUrl("/ws/trades"));
};

export const useMarketDataWebSocket = () => {
  return useWebSocket(getWebSocketUrl("/ws/market-data"));
};

export const useNotificationsWebSocket = () => {
  return useWebSocket(getWebSocketUrl("/ws/notifications"));
};

export const usePortfolioWebSocket = () => {
  return useWebSocket(getWebSocketUrl("/ws/portfolio"));
};