import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Zap, RefreshCw, Filter, Star, ArrowRight } from 'lucide-react';
import axios from 'axios';

const MarketScreener = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [filterVolatility, setFilterVolatility] = useState('all'); // low, medium, high
  const [favorites, setFavorites] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/market-screener', {
        params: {
          sortBy: sortBy,
          volatility: filterVolatility
        }
      });
      setTokens(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      setLoading(false);
    }
  };

  const toggleFavorite = (tokenAddress) => {
    if (favorites.includes(tokenAddress)) {
      setFavorites(favorites.filter(addr => addr !== tokenAddress));
    } else {
      setFavorites([...favorites, tokenAddress]);
    }
  };

  const filteredTokens = tokens.filter(token =>
    token.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVolatilityColor = (volatility) => {
    if (volatility < 5) return 'text-green-400 bg-green-400/10';
    if (volatility < 15) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  const getVolatilityLabel = (volatility) => {
    if (volatility < 5) return 'Low';
    if (volatility < 15) return 'Medium';
    return 'High';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Scanning market...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Market Screener</h1>
          <p className="text-gray-400">Find and track emerging opportunities</p>
        </div>
        <button
          onClick={fetchTokens}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Token name, symbol, or address..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-purple-500/30 rounded text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-700 border border-purple-500/30 rounded px-3 py-2 text-white"
            >
              <option value="volume">24h Volume</option>
              <option value="gainers">Top Gainers</option>
              <option value="losers">Top Losers</option>
              <option value="volatility">Volatility</option>
              <option value="newListings">New Listings</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Volatility</label>
            <select
              value={filterVolatility}
              onChange={(e) => setFilterVolatility(e.target.value)}
              className="w-full bg-slate-700 border border-purple-500/30 rounded px-3 py-2 text-white"
            >
              <option value="all">All</option>
              <option value="low">Low (&lt;5%)</option>
              <option value="medium">Medium (5-15%)</option>
              <option value="high">High (&gt;15%)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Show</label>
            <select
              defaultValue="all"
              className="w-full bg-slate-700 border border-purple-500/30 rounded px-3 py-2 text-white"
            >
              <option value="all">All Tokens</option>
              <option value="favorites">Favorites</option>
              <option value="new">New Today</option>
            </select>
          </div>
        </div>
      </div>

      {/* Token Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTokens.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400">No tokens found</p>
          </div>
        ) : (
          filteredTokens.slice(0, 30).map((token, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedToken(token)}
              className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xs font-bold">
                    {token.symbol?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{token.symbol}</p>
                    <p className="text-xs text-gray-400">{token.name}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(token.address);
                  }}
                  className={`p-2 rounded transition-colors ${
                    favorites.includes(token.address)
                      ? 'bg-yellow-400/20 text-yellow-400'
                      : 'hover:bg-purple-500/20'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Price</p>
                  <p className="text-lg font-bold text-white">${token.price?.toFixed(8)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">24h Change</p>
                    <p className={`font-semibold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h?.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Volatility</p>
                    <p className={`font-semibold px-2 py-1 rounded text-xs w-fit ${getVolatilityColor(token.volatility)}`}>
                      {getVolatilityLabel(token.volatility)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">24h Volume</p>
                  <p className="text-white font-semibold">${(token.volume24h / 1e6).toFixed(2)}M</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Liquidity</p>
                  <p className="text-white font-semibold">${(token.liquidity / 1e6).toFixed(2)}M</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedToken(token);
                }}
                className="w-full px-3 py-2 bg-purple-600/50 hover:bg-purple-600 rounded transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Zap className="w-4 h-4" />
                Quick Trade
              </button>
            </div>
          ))
        )}
      </div>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-purple-500/20 rounded-lg p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold">
                  {selectedToken.symbol?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedToken.symbol}</h3>
                  <p className="text-sm text-gray-400">{selectedToken.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedToken(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="text-3xl font-bold text-white">${selectedToken.price?.toFixed(8)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">24h Change</p>
                  <p className={`text-2xl font-bold ${selectedToken.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h?.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Volatility</p>
                  <p className={`text-2xl font-bold ${getVolatilityColor(selectedToken.volatility).split(' ')[0]}`}>
                    {selectedToken.volatility?.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">24h Volume</p>
                  <p className="text-xl font-bold text-white">${(selectedToken.volume24h / 1e9).toFixed(2)}B</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Market Cap</p>
                  <p className="text-xl font-bold text-white">${(selectedToken.marketCap / 1e9).toFixed(2)}B</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400">Liquidity</p>
                <p className="text-xl font-bold text-white">${(selectedToken.liquidity / 1e6).toFixed(2)}M</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Contract Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-purple-400 break-all">{selectedToken.address}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-5 h-5" />
                Buy
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-5 h-5" />
                Sell
              </button>
              <button
                onClick={() => setSelectedToken(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketScreener;
