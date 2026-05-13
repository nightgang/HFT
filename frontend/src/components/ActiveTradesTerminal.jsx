import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, X, Target, DollarSign, Clock } from 'lucide-react';

const ActiveTradesTerminal = () => {
  const [trades, setTrades] = useState([]);

  // Mock active trades data
  const mockTrades = [
    {
      id: 1,
      token: 'KAT',
      type: 'BUY',
      amount: '1000',
      entryPrice: '0.000842',
      currentPrice: '0.000956',
      pnl: '+$114',
      pnlPercent: '+13.5%',
      status: 'ACTIVE',
      timestamp: '13:01:10',
      strategy: 'Sniper',
    },
    {
      id: 2,
      token: 'SOL',
      type: 'SELL',
      amount: '50',
      entryPrice: '142.50',
      currentPrice: '138.20',
      pnl: '+$215',
      pnlPercent: '+3.0%',
      status: 'ACTIVE',
      timestamp: '13:01:12',
      strategy: 'Arbitrage',
    },
    {
      id: 3,
      token: 'BONK',
      type: 'BUY',
      amount: '50000',
      entryPrice: '0.00001234',
      currentPrice: '0.00001456',
      pnl: '+$111',
      pnlPercent: '+18.0%',
      status: 'ACTIVE',
      timestamp: '13:01:15',
      strategy: 'Momentum',
    },
  ];

  useEffect(() => {
    setTrades(mockTrades);

    // Simulate real-time price updates
    const interval = setInterval(() => {
      setTrades(prevTrades =>
        prevTrades.map(trade => {
          const priceChange = (Math.random() - 0.5) * 0.001; // Small random price change
          const newPrice = parseFloat(trade.currentPrice) + priceChange;
          const pnl = ((newPrice - parseFloat(trade.entryPrice)) * parseFloat(trade.amount)).toFixed(2);
          const pnlPercent = (((newPrice - parseFloat(trade.entryPrice)) / parseFloat(trade.entryPrice)) * 100).toFixed(1);

          return {
            ...trade,
            currentPrice: newPrice.toFixed(8),
            pnl: `${pnl.startsWith('-') ? '' : '+'}$${Math.abs(pnl)}`,
            pnlPercent: `${pnlPercent.startsWith('-') ? '' : '+'}${Math.abs(pnlPercent)}%`,
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const closeTrade = (tradeId) => {
    setTrades(prev => prev.filter(trade => trade.id !== tradeId));
  };

  const getTypeColor = (type) => {
    return type === 'BUY'
      ? 'bg-green-400/20 text-green-400 border-green-400/50'
      : 'bg-red-400/20 text-red-400 border-red-400/50';
  };

  const getPnlColor = (pnl) => {
    return pnl.startsWith('+') ? 'text-green-400' : 'text-red-400';
  };

  const getStrategyColor = (strategy) => {
    switch (strategy) {
      case 'Sniper': return 'text-purple-400';
      case 'Arbitrage': return 'text-cyan-400';
      case 'Momentum': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-4 font-mono text-sm bg-black min-h-[300px] relative">
      {/* CRT Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/5 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-400/30">
        <Target className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-bold">ACTIVE POSITIONS</span>
        <div className="flex-1"></div>
        <div className="text-xs text-gray-500">HFT Trading Engine</div>
      </div>

      {/* Trades Table */}
      <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-transparent">
        <AnimatePresence>
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-slate-900/50 rounded border border-green-400/20 hover:border-green-400/40 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10"
            >
              {/* Trade Header */}
              <div className="flex items-center justify-between p-3 border-b border-green-400/10">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 text-xs font-bold rounded border ${getTypeColor(trade.type)}`}>
                    {trade.type}
                  </div>
                  <span className="text-green-400 font-bold text-lg">{trade.token}</span>
                  <span className={`text-xs ${getStrategyColor(trade.strategy)}`}>
                    [{trade.strategy}]
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{trade.timestamp}</span>
                  <motion.button
                    onClick={() => closeTrade(trade.id)}
                    className="w-6 h-6 bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded border border-red-400/50 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>

              {/* Trade Details */}
              <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="text-green-400 font-mono">{trade.amount}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Entry</div>
                  <div className="text-gray-300 font-mono">${trade.entryPrice}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Current</div>
                  <motion.div
                    className="text-white font-mono"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ${trade.currentPrice}
                  </motion.div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">PNL</div>
                  <div className={`font-bold font-mono ${getPnlColor(trade.pnl)}`}>
                    {trade.pnl} ({trade.pnlPercent})
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="px-3 pb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-bold ${trade.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'}`}>
                    ● {trade.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {trades.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>No active positions</div>
          </motion.div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-2 border-t border-green-400/30 flex justify-between text-xs text-gray-500">
        <div>Positions: {trades.length}</div>
        <div>Total PNL: <span className="text-green-400">
          +${trades.reduce((sum, trade) => sum + parseFloat(trade.pnl.replace(/[+$]/g, '')), 0).toFixed(2)}
        </span></div>
        <div>Engine: <span className="text-green-400">● RUNNING</span></div>
      </div>
    </div>
  );
};

export default ActiveTradesTerminal;