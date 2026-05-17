import { useEffect, useMemo, useState } from "react";
import { useWebSocket } from "./useWebSocket";

const buildDashboardWebSocketUrl = () => {
  if (typeof window === "undefined") return null;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname || "localhost";
  const port = 3002;
  const token = localStorage.getItem("authToken") || "";
  const params = new URLSearchParams();

  if (token) params.set("token", token);

  return `${protocol}//${hostname}:${port}?${params.toString()}`;
};

export const useRealtimeDashboardData = () => {
  const wsUrl = useMemo(buildDashboardWebSocketUrl, []);
  const { isConnected, lastMessage, error, sendMessage } = useWebSocket(wsUrl, {
    maxRetries: 20,
    connectionTimeout: 5000,
  });

  const [dashboardState, setDashboardState] = useState({
    authUser: null,
    autoTradeStatus: null,
    alerts: [],
    activeTrades: null,
    wallets: null,
    systemStatus: null,
    lastMessageType: null,
    lastMessageAt: null,
  });

  useEffect(() => {
    if (!lastMessage) return;

    setDashboardState((current) => {
      const next = {
        ...current,
        lastMessageAt: Date.now(),
        lastMessageType: lastMessage.type || "message",
      };

      switch (lastMessage.type) {
        case "AUTH_SUCCESS":
          next.authUser = lastMessage.user || null;
          break;
        case "autotrade-status":
          next.autoTradeStatus = lastMessage;
          break;
        case "trade-update":
          next.activeTrades = lastMessage.trades || current.activeTrades;
          break;
        case "wallet-update":
          next.wallets = lastMessage.wallets || current.wallets;
          break;
        case "system-status":
          next.systemStatus = {
            ...current.systemStatus,
            ...lastMessage,
          };
          break;
        case "ERROR":
        case "error":
          next.errorMessage = lastMessage.error || lastMessage.message || "WebSocket error";
          break;
        case "alert":
        case "prediction-alert": {
          const incomingAlerts = Array.isArray(lastMessage.alerts)
            ? lastMessage.alerts
            : lastMessage.alert
              ? [lastMessage.alert]
              : [lastMessage];

          next.alerts = incomingAlerts.length > 0
            ? [...current.alerts, ...incomingAlerts]
            : current.alerts;
          break;
        }
        default:
          break;
      }

      return next;
    });
  }, [lastMessage]);

  return {
    ...dashboardState,
    isConnected,
    lastMessage,
    wsError: error,
    sendMessage,
    wsUrl,
  };
};
