import { TrendingUp, X } from 'lucide-react';

function KatanaActiveTrades() {
  const trades = [
    {
      id: 1,
      token: 'RAY',
      symbol: 'Raydium',
      amount: 150,
      entry: 5.24,
      current: 6.89,
      pnl: 247.50,
      pnlPercent: 31.5,
      tp1: { target: 10.48, sold: 45 },
      tp2: { target: 20.96, sold: 0 },
      sl: 4.19,
      status: 'TP1 HIT'
    },
    {
      id: 2,
      token: 'PSAI',
      symbol: 'Psychic',
      amount: 280,
      entry: 0.145,
      current: 0.182,
      pnl: 103.60,
      pnlPercent: 25.5,
      tp1: { target: 0.29, sold: 0 },
      tp2: { target: 0.58, sold: 0 },
      sl: 0.116,
      status: 'OPEN'
    },
    {
      id: 3,
      token: 'WIF',
      symbol: 'Dogwif',
      amount: 420,
      entry: 0.0842,
      current: 0.0651,
      pnl: -80.22,
      pnlPercent: -22.7,
      tp1: { target: 0.1684, sold: 0 },
      tp2: { target: 0.3368, sold: 0 },
      sl: 0.0673,
      status: 'MONITORED'
    },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-500/20 flex items-center space-x-2">
        <TrendingUp className="w-4 h-4 text-purple-400" />
        <h3 className="font-bold text-white text-sm">ACTIVE TRADES</h3>
        <div className="ml-auto text-xs text-gray-500">{trades.length} positions</div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="border-b border-purple-500/20 bg-black/40">
            <tr>
              <th className="px-4 py-2 text-left font-bold text-gray-400">TOKEN</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400">AMOUNT</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400">ENTRY</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400">CURRENT</th>
              <th className="px-4 py-2 text-right font-bold text-gray-400">PNL</th>
              <th className="px-4 py-2 text-center font-bold text-gray-400">TP/SL</th>
              <th className="px-4 py-2 text-center font-bold text-gray-400">STATUS</th>
              <th className="px-4 py-2 text-center font-bold text-gray-400">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/20">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-purple-500/5 transition group cursor-pointer">
                <td className="px-4 py-3">
                  <div className="font-bold text-white">{trade.token}</div>
                  <div className="text-gray-500">{trade.symbol}</div>
                </td>
                <td className="px-4 py-3 text-right text-white font-mono">{trade.amount}</td>
                <td className="px-4 py-3 text-right text-gray-400 font-mono">${trade.entry.toFixed(4)}</td>
                <td className="px-4 py-3 text-right text-purple-400 font-mono font-bold">${trade.current.toFixed(4)}</td>
                <td className="px-4 py-3 text-right">
                  <div className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${trade.pnl.toFixed(2)}
                  </div>
                  <div className={`text-xs ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(1)}%
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="space-y-1">
                    <div className="text-xs flex justify-center space-x-1">
                      <span className={`px-2 py-0.5 rounded ${trade.tp1.sold > 0 ? 'bg-green-500/30 text-green-400' : 'bg-purple-500/20 text-purple-300'}`}>
                        TP1: {trade.tp1.sold}%
                      </span>
                    </div>
                    <div className="text-xs text-red-400">SL: ${trade.sl.toFixed(4)}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    trade.status === 'TP1 HIT' ? 'bg-green-500/30 text-green-400 border border-green-500/50' :
                    trade.status === 'OPEN' ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50' :
                    'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                  }`}>
                    {trade.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1.5 hover:bg-red-500/30 rounded transition text-red-400 opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-black/40 border-t border-purple-500/20 text-xs">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-gray-500 mb-1">Total PNL</div>
            <div className="text-green-400 font-bold text-sm">+$270.88</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Win Rate</div>
            <div className="text-blue-400 font-bold text-sm">66.7%</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Avg Profit</div>
            <div className="text-green-400 font-bold text-sm">+11.2%</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Risk/Reward</div>
            <div className="text-purple-400 font-bold text-sm">1:3.2</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KatanaActiveTrades;