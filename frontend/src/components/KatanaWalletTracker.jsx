import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

function KatanaWalletTracker() {
  const wallets = [
    {
      id: 1,
      name: 'Main Wallet',
      address: 'Ey8...7fQ',
      balance: 45.32,
      pnl: 2850.50,
      pnlPercent: 6.7,
      trades: 12,
      trend: 'up'
    },
    {
      id: 2,
      name: 'Secondary',
      address: 'GKL...mN2',
      balance: 28.15,
      pnl: 1240.25,
      pnlPercent: 4.4,
      trades: 8,
      trend: 'up'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-500/20 flex items-center space-x-2">
        <Wallet className="w-4 h-4 text-purple-400" />
        <h3 className="font-bold text-white text-sm">WALLET TRACKER</h3>
      </div>

      {/* Content */}
      <div className="space-y-2 p-3 max-h-64 overflow-y-auto">
        {wallets.map(wallet => (
          <div key={wallet.id} className="p-3 bg-black/40 border border-purple-500/20 rounded-lg hover:border-purple-400/50 transition cursor-pointer group">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-white text-sm">{wallet.name}</div>
                <div className="text-xs text-gray-500">{wallet.address}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white text-sm">{wallet.balance} SOL</div>
                <div className="text-xs text-gray-500">${(wallet.balance * 168.35).toFixed(0)}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                <div className="text-gray-500">PnL</div>
                <div className={`font-bold ${wallet.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${wallet.pnl.toFixed(0)}
                </div>
                <div className={`text-xs ${wallet.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {wallet.pnl >= 0 ? '+' : ''}{wallet.pnlPercent.toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                <div className="text-gray-500">Trades</div>
                <div className="text-blue-400 font-bold">{wallet.trades}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                <div className="text-gray-500">Status</div>
                <div className="flex items-center space-x-1 text-green-400 font-bold">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs">Live</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Wallet Button */}
      <div className="px-3 pb-3">
        <button className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-xs font-bold rounded transition border border-purple-500/30">
          + ADD WALLET
        </button>
      </div>
    </div>
  );
}

export default KatanaWalletTracker;