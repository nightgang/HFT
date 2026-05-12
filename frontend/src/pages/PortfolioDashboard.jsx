import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff, RefreshCw, Download, PieChart } from 'lucide-react';
import axios from 'axios';

const PortfolioDashboard = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/portfolio');
      setPortfolio(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPortfolio();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    if (!portfolio) return;
    const csv = convertToCSV(portfolio.assets);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const convertToCSV = (assets) => {
    const headers = ['Token', 'Symbol', 'Amount', 'Price (USD)', 'Total Value (USD)', 'Change %'];
    const rows = assets.map(asset => [
      asset.name,
      asset.symbol,
      asset.amount,
      asset.price,
      asset.totalValue,
      asset.change24h
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading portfolio...</div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">No portfolio data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Dashboard</h1>
          <p className="text-gray-400">Manage and monitor your assets</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowValues(!showValues)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg transition-colors"
          >
            {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Value</p>
              <p className="text-2xl font-bold text-white">
                {showValues ? `$${portfolio.totalValue?.toFixed(2) || '0.00'}` : '••••••'}
              </p>
            </div>
            <Wallet className="w-12 h-12 text-purple-400 opacity-20" />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">24h Change</p>
              <p className={`text-2xl font-bold ${portfolio.change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.change24hPercent >= 0 ? '+' : ''}{portfolio.change24hPercent?.toFixed(2) || '0.00'}%
              </p>
            </div>
            {portfolio.change24hPercent >= 0 ? 
              <TrendingUp className="w-12 h-12 text-green-400 opacity-20" /> :
              <TrendingDown className="w-12 h-12 text-red-400 opacity-20" />
            }
          </div>
        </div>

        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Assets</p>
              <p className="text-2xl font-bold text-white">{portfolio.assets?.length || 0}</p>
            </div>
            <PieChart className="w-12 h-12 text-blue-400 opacity-20" />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Win Rate</p>
              <p className="text-2xl font-bold text-white">{portfolio.winRate?.toFixed(1) || '0.0'}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">Assets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/10">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Token</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Total Value</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">24h Change</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.assets?.map((asset, idx) => (
                <tr 
                  key={idx}
                  onClick={() => setSelectedToken(asset)}
                  className="border-b border-purple-500/10 hover:bg-purple-500/10 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xs font-bold">
                        {asset.symbol?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{asset.name}</p>
                        <p className="text-xs text-gray-400">{asset.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">{asset.amount?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-white">
                    {showValues ? `$${asset.price?.toFixed(2)}` : '••••'}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {showValues ? `$${asset.totalValue?.toFixed(2)}` : '••••'}
                  </td>
                  <td className={`px-6 py-4 ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h?.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                        style={{ width: `${asset.allocation || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{asset.allocation?.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-purple-500/20 rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{selectedToken.name}</h3>
              <button
                onClick={() => setSelectedToken(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p className="text-lg font-semibold text-white">{selectedToken.amount?.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Price</p>
                <p className="text-lg font-semibold text-white">${selectedToken.price?.toFixed(8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-lg font-semibold text-white">${selectedToken.totalValue?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">24h Change</p>
                <p className={`text-lg font-semibold ${selectedToken.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h?.toFixed(2)}%
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedToken(null)}
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

export default PortfolioDashboard;
