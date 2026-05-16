/**
 * Portfolio Page Template
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer, GridContainer, Card } from '../components/layouts';
import { LoadingSpinner, ErrorState } from '../components/common';
import { useGetHoldings, useGetAllocation, useGetPortfolioPerformance } from '../hooks';
import { Wallet, TrendingUp, BarChart3 } from 'lucide-react';

export default function Portfolio() {
  const [timeframe, setTimeframe] = useState('1d');

  const { data: holdings, isLoading: holdingsLoading } = useGetHoldings();
  const { data: allocation } = useGetAllocation();
  const { data: performance } = useGetPortfolioPerformance(timeframe);

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
      {/* Performance Overview */}
      <div className="flex items-center gap-4 mb-6">
        {['1d', '7d', '1m', '3m', '1y'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeframe === tf
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Allocation Chart & Holdings */}
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

      {/* Holdings Table */}
      <Card className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wallet size={20} className="text-purple-400" />
          Holdings
        </h3>
        {holdings && holdings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2 text-left text-gray-400">Token</th>
                  <th className="px-4 py-2 text-right text-gray-400">Amount</th>
                  <th className="px-4 py-2 text-right text-gray-400">Price</th>
                  <th className="px-4 py-2 text-right text-gray-400">Value</th>
                  <th className="px-4 py-2 text-right text-gray-400">Change</th>
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
                    <td className="px-4 py-2 text-white font-semibold">{holding.symbol}</td>
                    <td className="px-4 py-2 text-right text-gray-300">{holding.amount}</td>
                    <td className="px-4 py-2 text-right text-gray-300">
                      ${holding.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-white font-semibold">
                      ${holding.value.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-semibold ${
                        holding.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
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
