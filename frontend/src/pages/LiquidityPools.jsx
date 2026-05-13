import React, { useState, useEffect } from "react";
import { Zap, TrendingUp, Layers, Plus, Trash2 } from "lucide-react";
import axios from "axios";

const LiquidityPools = () => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPoolForm, setShowPoolForm] = useState(false);
  const [formData, setFormData] = useState({
    poolAddress: "",
    tokenAMint: "",
    tokenBMint: "",
    liquidity: "",
    feeRate: "",
    protocol: "raydium",
  });

  useEffect(() => {
    fetchPools();
    const interval = setInterval(fetchPools, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchPools = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/api/liquidity-pools",
      );
      setPools(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch pools:", error);
      setLoading(false);
    }
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/api/liquidity-pools", formData);
      setFormData({
        poolAddress: "",
        tokenAMint: "",
        tokenBMint: "",
        liquidity: "",
        feeRate: "",
        protocol: "raydium",
      });
      setShowPoolForm(false);
      fetchPools();
    } catch (error) {
      console.error("Failed to create pool:", error);
    }
  };

  const handleDeletePool = async (poolId) => {
    try {
      await axios.delete(`http://localhost:3001/api/liquidity-pools/${poolId}`);
      fetchPools();
    } catch (error) {
      console.error("Failed to delete pool:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading liquidity pools...</div>;
  }

  const totalLiquidity = pools.reduce((sum, p) => sum + (p.liquidity || 0), 0);
  const averageFeeRate =
    pools.length > 0
      ? (
          (pools.reduce((sum, p) => sum + (p.feeRate || 0), 0) / pools.length) *
          100
        ).toFixed(3)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Liquidity Pools</h1>
        <button
          onClick={() => setShowPoolForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Track Pool
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Liquidity</span>
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">
            ${(totalLiquidity / 1e6).toFixed(2)}M
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Across {pools.length} pools
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Fee Rate</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {averageFeeRate}%
          </div>
          <p className="text-xs text-gray-500 mt-2">Trading fees</p>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Pools</span>
            <Zap className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">
            {pools.length}
          </div>
          <p className="text-xs text-gray-500 mt-2">Being monitored</p>
        </div>
      </div>

      {showPoolForm && (
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Track Liquidity Pool</h2>
          <form onSubmit={handleCreatePool} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Pool Address
                </label>
                <input
                  type="text"
                  value={formData.poolAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, poolAddress: e.target.value })
                  }
                  placeholder="Enter pool address"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Token A Mint
                </label>
                <input
                  type="text"
                  value={formData.tokenAMint}
                  onChange={(e) =>
                    setFormData({ ...formData, tokenAMint: e.target.value })
                  }
                  placeholder="Token A mint"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Token B Mint
                </label>
                <input
                  type="text"
                  value={formData.tokenBMint}
                  onChange={(e) =>
                    setFormData({ ...formData, tokenBMint: e.target.value })
                  }
                  placeholder="Token B mint"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Liquidity
                </label>
                <input
                  type="number"
                  value={formData.liquidity}
                  onChange={(e) =>
                    setFormData({ ...formData, liquidity: e.target.value })
                  }
                  placeholder="Enter liquidity"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Fee Rate (%)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.feeRate}
                  onChange={(e) =>
                    setFormData({ ...formData, feeRate: e.target.value })
                  }
                  placeholder="Enter fee rate"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Protocol
                </label>
                <select
                  value={formData.protocol}
                  onChange={(e) =>
                    setFormData({ ...formData, protocol: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-purple-500/30 rounded px-3 py-2 text-white"
                >
                  <option value="raydium">Raydium</option>
                  <option value="orca">Orca</option>
                  <option value="marinade">Marinade</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
              >
                Track Pool
              </button>
              <button
                type="button"
                onClick={() => setShowPoolForm(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {pools.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No liquidity pools being tracked
          </div>
        ) : (
          pools.map((pool) => (
            <div
              key={pool.id}
              className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{pool.protocol}</h3>
                  <p className="text-sm text-gray-500">{pool.poolAddress}</p>
                  <div className="mt-2 text-xs text-gray-600">
                    Pair: {pool.tokenAMint?.substring(0, 6)}... /{" "}
                    {pool.tokenBMint?.substring(0, 6)}...
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <div className="text-white font-semibold">
                      ${(pool.liquidity / 1e6).toFixed(2)}M
                    </div>
                    <div className="text-xs text-gray-500">Liquidity</div>
                  </div>
                  <div>
                    <div className="text-purple-400 font-semibold">
                      {(pool.feeRate * 100).toFixed(3)}%
                    </div>
                    <div className="text-xs text-gray-500">Fee</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePool(pool.id)}
                  className="ml-4 p-2 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiquidityPools;
