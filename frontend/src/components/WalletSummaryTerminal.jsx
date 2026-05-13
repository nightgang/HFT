import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Activity, Shield } from 'lucide-react';

const WalletSummaryTerminal = () => {
  const [wallets, setWallets] = useState([]);
  const [totalStats, setTotalStats] = useState({ balance: 0, pnl: 0, trades: 0 });

  // Mock wallet data
  const mockWallets = [
    {
      id: 1,
      address: '7xKX...9mL2',
      balance: '45.32 SOL',
      pnl: '+8.72 SOL',
      pnlPercent: '+23.9%',
      trades: 12,
      status: 'ACTIVE',
      lastActivity: '13:01:15',
    },
    {
      id: 2,
      address: '3pQ8...T7wL',
      balance: '38.11 SOL',
      pnl: '+5.34 SOL',
      pnlPercent: '+16.3%',
      trades: 8,
      status: 'ACTIVE',
      lastActivity: '13:01:12',
    },
    {
      id: 3,
      address: '9kL5...2pQ8',
      balance: '22.45 SOL',
      pnl: '-2.18 SOL',
      pnlPercent: '-8.8%',
      trades: 5,
      status: 'ACTIVE',
      lastActivity: '13:01:10',
    },
  ];

  useEffect(() => {
    setWallets(mockWallets);

    // Calculate total stats
    const totalBalance = mockWallets.reduce((sum, wallet) => {
      return sum + parseFloat(wallet.balance.split(' ')[0]);
    }, 0);

    const totalPnl = mockWallets.reduce((sum, wallet) => {
      return sum + parseFloat(wallet.pnl.replace(/[+-]/g, ''));
    }, 0);

    const totalTrades = mockWallets.reduce((sum, wallet) => sum + wallet.trades, 0);

    setTotalStats({
      balance: totalBalance,
      pnl: totalPnl,
      trades: totalTrades,
    });

    // Simulate real-time balance updates
    const interval = setInterval(() => {
      setWallets(prevWallets =>
        prevWallets.map(wallet => {
          const balanceChange = (Math.random() - 0.5) * 0.1; // Small random balance change
          const pnlChange = balanceChange > 0 ? balanceChange : -Math.abs(balanceChange);
          const newBalance = parseFloat(wallet.balance.split(' ')[0]) + balanceChange;
          const newPnl = parseFloat(wallet.pnl.replace(/[+-]/g, '')) + pnlChange;

          return {
            ...wallet,
            balance: `${newBalance.toFixed(2)} SOL`,
            pnl: `${newPnl >= 0 ? '+' : ''}${newPnl.toFixed(2)} SOL`,
            pnlPercent: `${((newPnl / (newBalance - newPnl)) * 100).toFixed(1)}%`,
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPnlColor = (pnl) => {
    return pnl.startsWith('+') ? 'text-green-400' : 'text-red-400';
  };

  const getStatusColor = (status) => {
    return status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400';
  };

  return (
    <div className="p-4 font-mono text-sm bg-black min-h-[300px] relative">
      {/* CRT Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/5 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-400/30">
        <Wallet className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-bold">WALLET CLUSTER</span>
        <div className="flex-1"></div>
        <div className="text-xs text-gray-500">Smart wallet tracking</div>
      </div>

      {/* Total Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-3 bg-slate-900/50 rounded border border-green-400/20"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Total Balance</div>
            <div className="text-lg font-bold text-green-400">
              {totalStats.balance.toFixed(2)} SOL
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">24H PNL</div>
            <div className={`text-lg font-bold ${totalStats.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
              +{totalStats.pnl.toFixed(2)} SOL
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Active Trades</div>
            <div className="text-lg font-bold text-cyan-400">
              {totalStats.trades}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wallet List */}
      <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-transparent">
        <AnimatePresence>
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-slate-900/50 rounded border border-green-400/20 hover:border-green-400/40 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10"
            >
              {/* Wallet Header */}
              <div className="flex items-center justify-between p-3 border-b border-green-400/10">
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-green-400 font-mono font-bold">{wallet.address}</div>
                    <div className="text-xs text-gray-500">Last activity: {wallet.lastActivity}</div>
                  </div>
                </div>
                <div className={`text-xs font-bold ${getStatusColor(wallet.status)}`}>
                  ● {wallet.status}
                </div>
              </div>

              {/* Wallet Stats */}
              <div className="p-3 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Balance</div>
                  <motion.div
                    className="text-green-400 font-mono font-bold"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {wallet.balance}
                  </motion.div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">PNL</div>
                  <div className={`font-mono font-bold ${getPnlColor(wallet.pnl)}`}>
                    {wallet.pnl}
                  </div>
                  <div className={`text-xs ${getPnlColor(wallet.pnl)}`}>
                    {wallet.pnlPercent}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Trades</div>
                  <div className="text-cyan-400 font-mono font-bold">
                    {wallet.trades}
                  </div>
                </div>
              </div>

              {/* Activity Indicator */}
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 text-xs">
                  <Activity className="w-3 h-3 text-green-400" />
                  <span className="text-gray-500">Active monitoring</span>
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  ></motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-2 border-t border-green-400/30 flex justify-between items-center text-xs">
        <div className="flex gap-4">
          <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
            [REFRESH]
          </button>
          <button className="text-purple-400 hover:text-purple-300 transition-colors">
            [REBALANCE]
          </button>
        </div>
        <div className="text-gray-500">
          Wallets: {wallets.length} | Status: <span className="text-green-400">● HEALTHY</span>
        </div>
      </div>
    </div>
  );
};

export default WalletSummaryTerminal;