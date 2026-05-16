/**
 * Enhanced useApi hook
 * Wrapper around service layer for React Query integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  tradingService,
  walletService,
  ordersService,
  portfolioService,
  analyticsService,
  tradeHistoryService,
  alertsService,
  notificationsService,
  monitoringService,
  systemService,
} from '../services';

// Trading Hooks
export const useGetTrades = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['trades', filters],
    queryFn: () => tradingService.getAllTrades(filters),
    refetchInterval: 30000,
    ...options,
  });
};

export const useGetTradeById = (tradeId, options = {}) => {
  return useQuery({
    queryKey: ['trade', tradeId],
    queryFn: () => tradingService.getTradeById(tradeId),
    enabled: !!tradeId,
    ...options,
  });
};

export const useCreateTrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tradeData) => tradingService.createTrade(tradeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};

export const useCancelTrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tradeId) => tradingService.cancelTrade(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};

export const useExecuteTrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tradeId) => tradingService.executeTrade(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};

// Market Data Hooks
export const useMarketData = (tokenMint, options = {}) => {
  return useQuery({
    queryKey: ['marketData', tokenMint],
    queryFn: () => tradingService.getMarketData(tokenMint),
    enabled: !!tokenMint,
    refetchInterval: 5000,
    ...options,
  });
};

export const useGetTWAP = (tokenMint, timewindow = 300, options = {}) => {
  return useQuery({
    queryKey: ['twap', tokenMint, timewindow],
    queryFn: () => tradingService.getTWAP(tokenMint, timewindow),
    enabled: !!tokenMint,
    refetchInterval: 10000,
    ...options,
  });
};

// Wallet Hooks
export const useGetWallets = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['wallets', filters],
    queryFn: () => walletService.getAllWallets(filters),
    ...options,
  });
};

export const useGetWalletById = (walletId, options = {}) => {
  return useQuery({
    queryKey: ['wallet', walletId],
    queryFn: () => walletService.getWalletById(walletId),
    enabled: !!walletId,
    refetchInterval: 15000,
    ...options,
  });
};

export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletData) => walletService.createWallet(walletData.name, walletData.description, walletData.type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
};

export const useGetWalletBalance = (walletId, options = {}) => {
  return useQuery({
    queryKey: ['walletBalance', walletId],
    queryFn: () => walletService.getWalletBalance(walletId),
    enabled: !!walletId,
    refetchInterval: 10000,
    ...options,
  });
};

// Orders Hooks
export const useGetOrders = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersService.getAllOrders(filters),
    refetchInterval: 20000,
    ...options,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderData) => ordersService.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => ordersService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Portfolio Hooks
export const useGetPortfolioOverview = (options = {}) => {
  return useQuery({
    queryKey: ['portfolioOverview'],
    queryFn: () => portfolioService.getPortfolioOverview(),
    refetchInterval: 30000,
    ...options,
  });
};

export const useGetHoldings = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['holdings', filters],
    queryFn: () => portfolioService.getHoldings(filters),
    refetchInterval: 25000,
    ...options,
  });
};

export const useGetAllocation = (options = {}) => {
  return useQuery({
    queryKey: ['allocation'],
    queryFn: () => portfolioService.getAllocation(),
    refetchInterval: 30000,
    ...options,
  });
};

export const useGetPortfolioPerformance = (timeframe = '1d', options = {}) => {
  return useQuery({
    queryKey: ['performance', timeframe],
    queryFn: () => portfolioService.getPerformance(timeframe),
    refetchInterval: 30000,
    ...options,
  });
};

// Analytics Hooks
export const useGetPerformanceAnalytics = (timeframe = '1d', options = {}) => {
  return useQuery({
    queryKey: ['analytics', timeframe],
    queryFn: () => analyticsService.getPerformanceAnalytics(timeframe),
    refetchInterval: 60000,
    ...options,
  });
};

export const useGetTradeAnalytics = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['tradeAnalytics', filters],
    queryFn: () => analyticsService.getTradeAnalytics(filters),
    refetchInterval: 60000,
    ...options,
  });
};

export const useTradeHistory = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['tradeHistory', filters],
    queryFn: () => tradeHistoryService.getAllTrades(filters),
    refetchInterval: 30000,
    ...options,
  });
};

// Alerts Hooks
export const useGetAlerts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => alertsService.getAllAlerts(filters),
    ...options,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertData) => alertsService.createAlert(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId) => alertsService.deleteAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// Notifications Hooks
export const useGetNotifications = (limit = 50, offset = 0, options = {}) => {
  return useQuery({
    queryKey: ['notifications', limit, offset],
    queryFn: () => notificationsService.getAllNotifications(limit, offset),
    refetchInterval: 15000,
    ...options,
  });
};

export const useGetUnreadCount = (options = {}) => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30000,
    ...options,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) => notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

// Monitoring Hooks
export const useGetSystemStatus = (options = {}) => {
  return useQuery({
    queryKey: ['systemStatus'],
    queryFn: () => monitoringService.getSystemStatus(),
    refetchInterval: 30000,
    ...options,
  });
};

export const useGetHealthCheck = (options = {}) => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => monitoringService.getHealthCheck(),
    refetchInterval: 30000,
    ...options,
  });
};

export const useGetActiveTrades = (options = {}) => {
  return useQuery({
    queryKey: ['activeTrades'],
    queryFn: () => monitoringService.getActiveTrades(),
    refetchInterval: 10000,
    ...options,
  });
};

export const useGetSystemLogs = (limit = 100, offset = 0, options = {}) => {
  return useQuery({
    queryKey: ['systemLogs', limit, offset],
    queryFn: () => monitoringService.getSystemLogs(limit, offset),
    ...options,
  });
};

// System Hooks
export const useGetAPIKeys = (options = {}) => {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => systemService.getAPIKeys(),
    ...options,
  });
};

export const useCreateAPIKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => systemService.createAPIKey(data.name, data.permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
};

export const useDeleteAPIKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId) => systemService.deleteAPIKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
};

export const useGetMarketData = useMarketData;
export const useCreateApiKey = useCreateAPIKey;
export const useDeleteApiKey = useDeleteAPIKey;

export const useGetWebhooks = (options = {}) => {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => systemService.getWebhooks(),
    ...options,
  });
};

export const useCreateWebhook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookData) => systemService.createWebhook(webhookData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
};

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookId) => systemService.deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
};

export const useApiKeys = useGetAPIKeys;
export const useNotifications = useGetNotifications;
export const useMarkNotificationRead = useMarkNotificationAsRead;

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) => notificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useRegenerateAPIKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId) => systemService.regenerateAPIKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
};

export const useRegenerateApiKey = useRegenerateAPIKey;