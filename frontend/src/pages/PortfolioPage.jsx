/**
 * Portfolio Page Template
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PageContainer,
  GridContainer,
  Card,
  LoadingSpinner,
  ErrorState,
} from '../components';
import { useGetHoldings, useGetAllocation, useGetPortfolioPerformance } from '../hooks';
import { Button } from '../components/ui';
import { Wallet, TrendingUp, BarChart3, RefreshCw, Download, Eye, EyeOff } from 'lucide-react';

export default function Portfolio() {
  const [timeframe, setTimeframe] = useState('1d');

  const [showValues, setShowValues] = useState(true);
  const { data: holdings, isLoading: holdingsLoading } = useGetHoldings();
  const { data: allocation } = useGetAllocation();
  const { data: performance } = useGetPortfolioPerformance(timeframe);

  const totalValue = holdings?.reduce((sum, item) => sum + (item?.value || 0), 0) || 0;

  const handleExport = () => {
    if (!holdings?.length) return;
    const headers = ['Token', 'Amount', 'Price', 'Value', 'Change'];
    const rows = holdings.map((holding) => [
      holding.symbol,
      holding.amount,
      holding.price,
      holding.value,
      holding.change,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holdings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (holdingsLoading) {
    return (
      <PageContainer title="Portfolio">
        <LoadingSpinner message="Loading portfolio..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Portfolio Management"
      description="Track your holdings and asset allocation"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-gray-400">Performance snapshot and portfolio management tools</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowValues((current) => !current)}
          >
            {showValues ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {showValues ? 'Hide Values' : 'Show Values'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={!holdings?.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Holdings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-white">{showValues ? `$${totalValue.toFixed(2)}` : '••••••'}</p>
            </div>
            <Wallet className="w-10 h-10 text-blue-400 opacity-80" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm">Holdings</p>
              <p className="text-2xl font-bold text-white">{holdings?.length || 0}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-violet-400 opacity-80" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm">Return</p>
              <p className={`text-2xl font-bold ${performance?.return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {performance?.return != null ? `${performance.return >= 0 ? '+' : ''}${performance.return.toFixed(2)}%` : 'N/A'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-emerald-400 opacity-80" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm">Max Drawdown</p>
              <p className="text-2xl font-bold text-white">{performance?.maxDrawdown != null ? `${performance.maxDrawdown.toFixed(2)}%` : 'N/A'}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-cyan-400 opacity-80" />
          </div>
        </Card>
      </div>

      <GridContainer columns={2}>
        {/* Allocation */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Asset Allocation</h3>
          </div>
          {allocation && (
            <div className="space-y-3">
              {allocation.map((asset, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-gray-300">{asset.symbol}</span>
                  <div className="flex-1 mx-3 bg-gray-800 rounded-full h-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${asset.percentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">
                    {asset.percentage.toFixed(1)}%
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Performance */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-green-400" />
            <h3 className="text-lg font-semibold text-white">Performance ({timeframe})</h3>
          </div>
          {performance && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Return</span>
                <span className={performance.return >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {performance.return >= 0 ? '+' : ''}{performance.return.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sharpe Ratio</span>
                <span className="text-white">{performance.sharpeRatio?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Drawdown</span>
                <span className="text-red-400">{performance.maxDrawdown?.toFixed(2) || 'N/A'}%</span>
              </div>
            </div>
          )}
        </Card>
      </GridContainer>

      <Card className="mt-8 overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wallet size={20} className="text-purple-400" /> Holdings
            </h3>
            <p className="text-gray-400 text-sm">Detailed asset list and value exposure.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={!holdings?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowValues((current) => !current)}>
              {showValues ? 'Hide Values' : 'Show Values'}
            </Button>
          </div>
        </div>
        {holdings && holdings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-gray-400">Token</th>
                  <th className="px-4 py-3 text-right text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-right text-gray-400">Price</th>
                  <th className="px-4 py-3 text-right text-gray-400">Value</th>
                  <th className="px-4 py-3 text-right text-gray-400">Change</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <motion.tr
                    key={holding.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition"
                  >
                    <td className="px-4 py-3 text-white font-semibold">{holding.symbol}</td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {showValues ? holding.amount : '••••'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {showValues ? `$${holding.price.toFixed(2)}` : '••••'}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold">
                      {showValues ? `$${holding.value.toFixed(2)}` : '••••'}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${holding.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No holdings found</p>
        )}
      </Card>
    </PageContainer>
  );
}
