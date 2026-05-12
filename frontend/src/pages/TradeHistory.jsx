import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Copy, Filter, Download, Clock, DollarSign } from 'lucide-react';
import axios from 'axios';

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, buy, sell
  const [timeRange, setTimeRange] = useState('7d'); // 1d, 7d, 30d, all
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState(null);

  useEffect(() => {
    fetchTradeHistory();
  }, [filter, timeRange]);

  const fetchTradeHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/trade-history', {
        params: {
          type: filter,
          timeRange: timeRange
        }
      });
      setTrades(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    const csv = convertToCSV(filteredTrades);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const convertToCSV = (trades) => {
    const headers = ['Date', 'Token', 'Type', 'Amount', 'Price', 'Total', 'Fee', 'PnL', 'Status'];
    const rows = trades.map(trade => [
      new Date(trade.timestamp).toLocaleString(),
      trade.tokenSymbol,
      trade.type,
      trade.amount,
      trade.price,
      trade.totalValue,
      trade.fee,
      trade.pnl,
      trade.status
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const filteredTrades = trades.filter(trade =>
    trade.tokenSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.tokenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.txHash?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading trade history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trade History</h1>
          <p className="text-gray-400">View all your executed trades</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-700 border border-purple-500/30 rounded px-3 py-2 text-white"
            >
              <option value="all">All Trades</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full bg-slate-700 border border-purple-500/30 rounded px-3 py-2 text-white"
            >
              <option value="1d">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Token, tx hash..."
              className="w-full bg-slate-700 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Trades</p>
          <p className="text-2xl font-bold text-white">{filteredTrades.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Buys / Sells</p>
          <p className="text-2xl font-bold text-white">
            {filteredTrades.filter(t => t.type === 'buy').length} / {filteredTrades.filter(t => t.type === 'sell').length}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Volume</p>
          <p className="text-2xl font-bold text-white">
            ${filteredTrades.reduce((sum, t) => sum + (t.totalValue || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Fees</p>
          <p className="text-2xl font-bold text-white">
            ${filteredTrades.reduce((sum, t) => sum + (t.fee || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Trade List */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">Trades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/10">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Token</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Fee</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">PnL</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">TX</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                    No trades found
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => setSelectedTrade(trade)}
                    className="border-b border-purple-500/10 hover:bg-purple-500/10 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {new Date(trade.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-xs font-bold flex items-center justify-center">
                          {trade.tokenSymbol?.substring(0, 1).toUpperCase()}
                        </div>
                        <span className="text-white font-semibold">{trade.tokenSymbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 font-semibold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.type === 'buy' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{trade.amount?.toFixed(6)}</td>
                    <td className="px-6 py-4 text-white">${trade.price?.toFixed(8)}</td>
                    <td className="px-6 py-4 text-white">${trade.totalValue?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-300">${trade.fee?.toFixed(2)}</td>
                    <td className={`px-6 py-4 font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(trade.txHash);
                        }}
                        className="px-2 py-1 bg-purple-600/50 hover:bg-purple-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-purple-500/20 rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Trade Details</h3>
              <button
                onClick={() => setSelectedTrade(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Token</p>
                <p className="text-lg font-semibold text-white">{selectedTrade.tokenSymbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <p className={`text-lg font-semibold ${selectedTrade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedTrade.type.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p className="text-lg font-semibold text-white">{selectedTrade.amount?.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="text-lg font-semibold text-white">${selectedTrade.price?.toFixed(8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-lg font-semibold text-white">${selectedTrade.totalValue?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Fee</p>
                <p className="text-lg font-semibold text-white">${selectedTrade.fee?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">TX Hash</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-purple-400 truncate">{selectedTrade.txHash}</p>
                  <button
                    onClick={() => copyToClipboard(selectedTrade.txHash)}
                    className="p-1 hover:bg-purple-600/50 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedTrade(null)}
              className="w-full mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
