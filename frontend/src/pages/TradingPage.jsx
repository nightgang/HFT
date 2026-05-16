/**
 * Trading Page Template
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer, GridContainer, Card } from '../components/layouts';
import { LoadingSpinner, ErrorState } from '../components/common';
import { TradingPanel } from '../components/trading';
import { useGetTrades, useGetOrders, useGetMarketData } from '../hooks';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export default function Trading() {
  const [selectedToken, setSelectedToken] = useState(null);

  const { data: trades, isLoading: tradesLoading } = useGetTrades();
  const { data: orders } = useGetOrders();
  const { data: marketData } = useGetMarketData(selectedToken?.mint);

  return (
    <PageContainer
      title="Trading"
      description="Execute trades and manage your orders"
    >
      {/* Trading Interface */}
      <GridContainer columns={3}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <TradingPanel walletId={null} selectedToken={selectedToken} />
        </motion.div>

        {/* Market Data */}
        <motion.div
          className="col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {marketData ? (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Market Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Price</p>
                  <p className="text-2xl font-bold text-white">${marketData.price}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">24h Change</p>
                  <p
                    className={`text-2xl font-bold ${
                      marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">24h Volume</p>
                  <p className="text-lg font-semibold text-white">
                    ${(marketData.volume24h / 1e9).toFixed(2)}B
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Market Cap</p>
                  <p className="text-lg font-semibold text-white">
                    ${(marketData.marketCap / 1e9).toFixed(2)}B
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-gray-400 text-center py-8">Select a token to view market data</p>
            </Card>
          )}
        </motion.div>
      </GridContainer>

      {/* Active Orders */}
      {orders && orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-yellow-400" />
              Active Orders ({orders.length})
            </h3>
            <div className="space-y-3">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        order.side === 'buy'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {order.side === 'buy' ? (
                        <ArrowDownLeft size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{order.symbol}</p>
                      <p className="text-xs text-gray-400">
                        {order.type} • {order.amount} @ ${order.price}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      ${(order.amount * order.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{order.status}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </PageContainer>
  );
}
