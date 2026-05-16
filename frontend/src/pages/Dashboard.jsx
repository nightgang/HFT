/**
 * Improved Dashboard Page
 * Uses services and hooks for data management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer, GridContainer, Card, MainLayout } from '../components/layouts';
import {
  LoadingSpinner,
  ErrorState,
  StatCard,
  DashboardOverview,
} from '../components/dashboard';
import { TradingPanel } from '../components/trading';
import { PortfolioOverview } from '../components/portfolio';
import {
  useGetPortfolioOverview,
  useGetActiveTrades,
  useGetSystemStatus,
} from '../hooks';
import {
  TrendingUp,
  Wallet,
  Activity,
  DollarSign,
  Target,
} from 'lucide-react';

export default function Dashboard() {
  const [selectedWallet, setSelectedWallet] = useState(null);

  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } =
    useGetPortfolioOverview();
  const { data: activeTrades, isLoading: tradesLoading } = useGetActiveTrades();
  const { data: systemStatus } = useGetSystemStatus();

  if (portfolioLoading) {
    return (
      <PageContainer title="Dashboard">
        <LoadingSpinner message="Loading dashboard..." />
      </PageContainer>
    );
  }

  if (portfolioError) {
    return (
      <PageContainer title="Dashboard">
        <ErrorState error={portfolioError} />
      </PageContainer>
    );
  }

  const stats = [
    {
      label: 'Portfolio Value',
      value: `$${portfolio?.totalValue?.toFixed(2) || '0.00'}`,
      change: portfolio?.change24h,
      icon: DollarSign,
      color: 'purple',
    },
    {
      label: 'Active Trades',
      value: activeTrades?.length || 0,
      icon: Target,
      color: 'green',
    },
    {
      label: 'Today\'s P&L',
      value: `$${portfolio?.pnlToday?.toFixed(2) || '0.00'}`,
      change: portfolio?.pnlTodayPercent,
      icon: TrendingUp,
      color: 'blue',
    },
    {
      label: 'Holdings',
      value: portfolio?.holdings?.length || 0,
      icon: Wallet,
      color: 'purple',
    },
  ];

  return (
    <PageContainer
      title="Trading Dashboard"
      description="Real-time trading overview and market insights"
    >
      {/* Statistics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardOverview stats={stats} />
      </motion.div>

      {/* Main Content Grid */}
      <GridContainer columns={3} className="mt-8">
        {/* Trading Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TradingPanel walletId={selectedWallet?.id} />
        </motion.div>

        {/* Portfolio Overview */}
        <motion.div
          className="col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PortfolioOverview />
        </motion.div>
      </GridContainer>

      {/* Active Trades */}
      {!tradesLoading && activeTrades && activeTrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Activity size={24} className="text-green-400" />
              <h3 className="text-lg font-semibold text-white">Active Trades</h3>
            </div>
            <div className="space-y-3">
              {activeTrades.slice(0, 5).map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-white">{trade.symbol}</p>
                    <p className="text-xs text-gray-400">
                      {trade.side === 'buy' ? 'BUY' : 'SELL'} @ ${trade.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{trade.amount}</p>
                    <p
                      className={`text-sm ${
                        trade.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </PageContainer>
  );
}
