/**
 * Trading Panel Component
 * Main trading interface
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../layouts';
import { StatusBadge } from '../common';
import { useCreateOrder } from '../../hooks';
import { Zap, Send } from 'lucide-react';

export const TradingPanel = ({ walletId, selectedToken = null }) => {
  const [orderData, setOrderData] = useState({
    type: 'limit',
    side: 'buy',
    amount: '',
    price: '',
  });

  const createOrder = useCreateOrder();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrder.mutateAsync({
        walletId,
        tokenMint: selectedToken?.mint,
        ...orderData,
      });
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" />
          Trading
        </h3>
        <StatusBadge status={walletId ? 'active' : 'inactive'} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Order Type</label>
          <div className="flex gap-2">
            {['limit', 'market'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderData({ ...orderData, type })}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                  orderData.type === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Side Selection */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Side</label>
          <div className="flex gap-2">
            {['buy', 'sell'].map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setOrderData({ ...orderData, side })}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                  orderData.side === side
                    ? side === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {side.charAt(0).toUpperCase() + side.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount</label>
          <input
            type="number"
            value={orderData.amount}
            onChange={(e) => setOrderData({ ...orderData, amount: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition"
            placeholder="Enter amount"
            required
          />
        </div>

        {/* Price (for limit orders) */}
        {orderData.type === 'limit' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Price</label>
            <input
              type="number"
              value={orderData.price}
              onChange={(e) => setOrderData({ ...orderData, price: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition"
              placeholder="Enter price"
              required
            />
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!walletId || createOrder.isPending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <Send size={18} />
          {createOrder.isPending ? 'Placing...' : 'Place Order'}
        </motion.button>
      </form>
    </Card>
  );
};
