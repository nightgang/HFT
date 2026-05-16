/**
 * Portfolio Overview Component
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, GridContainer } from '../layouts';
import { LoadingSpinner, ErrorState } from '../common';
import { useGetPortfolioOverview, useGetAllocation } from '../../hooks';
import { Wallet, TrendingUp } from 'lucide-react';

export const PortfolioOverview = () => {
  const {
    data: portfolio,
    isLoading: portfolioLoading,
    error: portfolioError,
  } = useGetPortfolioOverview();

  const {
    data: allocation,
    isLoading: allocationLoading,
  } = useGetAllocation();

  if (portfolioLoading || allocationLoading) {
    return <LoadingSpinner message="Loading portfolio..." />;
  }

  if (portfolioError) {
    return <ErrorState error={portfolioError} />;
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <GridContainer columns={2}>
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="text-purple-400" size={24} />
            <h3 className="text-lg font-semibold text-white">Total Value</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            ${portfolio?.totalValue?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-green-400 mt-2">
            +{portfolio?.change24h?.toFixed(2) || '0.00'}%
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-green-400" size={24} />
            <h3 className="text-lg font-semibold text-white">Holdings</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {portfolio?.holdings?.length || 0}
          </p>
          <p className="text-sm text-gray-400 mt-2">Active positions</p>
        </Card>
      </GridContainer>

      {/* Asset Allocation */}
      {allocation && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Asset Allocation</h3>
          <div className="space-y-3">
            {allocation.map((asset, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between"
              >
                <span className="text-gray-300">{asset.symbol}</span>
                <div className="flex-1 mx-4 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
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
        </Card>
      )}
    </div>
  );
};
