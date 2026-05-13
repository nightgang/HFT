import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// API Base URL
const API_BASE = "/api";

// System endpoints
export const useSystemStatus = () => {
  return useQuery({
    queryKey: ["system", "status"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/system/status`);
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useDetections = () => {
  return useQuery({
    queryKey: ["system", "detections"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/system/detections`);
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

// Trading endpoints
export const useWallets = () => {
  return useQuery({
    queryKey: ["trading", "wallets"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/trading/wallets`);
      return response.data;
    },
  });
};

export const useConnectWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walletData) => {
      const response = await axios.post(`${API_BASE}/trading/wallet/connect`, walletData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading", "wallets"] });
    },
  });
};

// Trade History
export const useTradeHistory = (params = {}) => {
  return useQuery({
    queryKey: ["trade-history", params],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/trade-history`, { params });
      return response.data;
    },
  });
};

// Portfolio
export const usePortfolio = () => {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/portfolio`);
      return response.data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
};

// API Keys
export const useApiKeys = () => {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api-keys`);
      return response.data;
    },
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyData) => {
      const response = await axios.post(`${API_BASE}/api-keys`, keyData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId) => {
      await axios.delete(`${API_BASE}/api-keys/${keyId}`);
      return keyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
};

export const useRegenerateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId) => {
      const response = await axios.put(`${API_BASE}/api-keys/${keyId}/regenerate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
};

// Notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/notifications`);
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      await axios.put(`${API_BASE}/notifications/${notificationId}/read`);
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      await axios.delete(`${API_BASE}/notifications/${notificationId}`);
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await axios.put(`${API_BASE}/notifications/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// Performance Analytics
export const usePerformanceAnalytics = (params = {}) => {
  return useQuery({
    queryKey: ["performance-analytics", params],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/performance-analytics`, { params });
      return response.data;
    },
  });
};

// Market Screener
export const useMarketScreener = (params = {}) => {
  return useQuery({
    queryKey: ["market-screener", params],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/market-screener`, { params });
      return response.data;
    },
    refetchInterval: 10000,
  });
};

// Predictive Alerts
export const usePredictiveAlerts = () => {
  return useQuery({
    queryKey: ["predictive-alerts"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/predictive-alerts`);
      return response.data;
    },
    refetchInterval: 20000,
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId) => {
      await axios.put(`${API_BASE}/predictive-alerts/${alertId}/acknowledge`);
      return alertId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictive-alerts"] });
    },
  });
};

// P&L Dashboard
export const usePnLDashboard = (period = "1d") => {
  return useQuery({
    queryKey: ["pnl-dashboard", period],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/pnl-dashboard?period=${period}`);
      return response.data;
    },
    refetchInterval: 30000,
  });
};

// Risk Heatmap
export const useRiskHeatmap = () => {
  return useQuery({
    queryKey: ["risk-heatmap"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/risk-heatmap`);
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useCorrelationMatrix = () => {
  return useQuery({
    queryKey: ["correlation-matrix"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/correlation-matrix`);
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

// Sentiment Analysis
export const useSentimentAnalysis = (filter = "all") => {
  return useQuery({
    queryKey: ["sentiment-analysis", filter],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/sentiment-analysis?source=${filter}`);
      return response.data;
    },
    refetchInterval: 30000,
  });
};

// Advanced Orders
export const useAdvancedOrders = () => {
  return useQuery({
    queryKey: ["advanced-orders"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/advanced-orders`);
      return response.data;
    },
  });
};

export const useCreateAdvancedOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData) => {
      const response = await axios.post(`${API_BASE}/advanced-orders`, orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advanced-orders"] });
    },
  });
};

export const useDeleteAdvancedOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      await axios.delete(`${API_BASE}/advanced-orders/${orderId}`);
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advanced-orders"] });
    },
  });
};

// Liquidity Pools
export const useLiquidityPools = () => {
  return useQuery({
    queryKey: ["liquidity-pools"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/liquidity-pools`);
      return response.data;
    },
  });
};

export const useCreateLiquidityPool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poolData) => {
      const response = await axios.post(`${API_BASE}/liquidity-pools`, poolData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidity-pools"] });
    },
  });
};

export const useDeleteLiquidityPool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poolId) => {
      await axios.delete(`${API_BASE}/liquidity-pools/${poolId}`);
      return poolId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidity-pools"] });
    },
  });
};

// Cross-Chain Bridge
export const useCrossChainBridge = () => {
  return useQuery({
    queryKey: ["cross-chain-bridge"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/cross-chain-bridge`);
      return response.data;
    },
  });
};

export const useBridgeTokens = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bridgeData) => {
      const response = await axios.post(`${API_BASE}/cross-chain-bridge`, bridgeData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cross-chain-bridge"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
};

// Jito Bundles
export const useJitoBundles = () => {
  return useQuery({
    queryKey: ["jito-bundles"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/jito-bundles`);
      return response.data;
    },
  });
};

export const useCreateJitoBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bundleData) => {
      const response = await axios.post(`${API_BASE}/jito-bundles`, bundleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jito-bundles"] });
    },
  });
};

export const useDeleteJitoBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bundleId) => {
      await axios.delete(`${API_BASE}/jito-bundles/${bundleId}`);
      return bundleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jito-bundles"] });
    },
  });
};

// Settings
export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/settings`);
      return response.data;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings) => {
      await axios.put(`${API_BASE}/settings`, settings);
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};