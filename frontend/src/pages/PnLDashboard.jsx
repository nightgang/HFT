import React, { useState, useEffect } from "react";
import { TrendingUp, BarChart3, Zap, AlertTriangle } from "lucide-react";
import axios from "axios";

const PnLDashboard = () => {
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("day");

  useEffect(() => {
    fetchPnLData();
    const interval = setInterval(fetchPnLData, 10000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchPnLData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/pnl-dashboard?period=${period}`,
      );
      setPnl(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch P&L data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading P&L data...</div>;
  }

  if (!pnl) {
    return (
      <div className="text-center py-12 text-gray-500">
        No P&L data available
      </div>
    );
  }

  const totalPnL = pnl.totalPnL || 0;
  const realizedPnL = pnl.realizedPnL || 0;
  const unrealizedPnL = pnl.unrealizedPnL || 0;
  const roi = pnl.roi || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">P&L Dashboard</h1>
        <div className="flex gap-2">
          {["day", "week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === p
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total P&L</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">
            ${totalPnL.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-2">Realized + Unrealized</p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Realized P&L</span>
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">
            ${realizedPnL.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-2">Locked gains/losses</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Unrealized P&L</span>
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400">
            ${unrealizedPnL.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-2">Open positions</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-900/5 border border-yellow-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">ROI</span>
            <TrendingUp className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {roi.toFixed(2)}%
          </div>
          <p className="text-xs text-gray-500 mt-2">Return on investment</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Performance Breakdown
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Win Rate</span>
              <span className="text-white font-semibold">
                {pnl.winRate?.toFixed(2) || 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400"
                style={{ width: `${((pnl.winRate || 0) / 100) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Profit Factor</span>
              <span className="text-white font-semibold">
                {pnl.profitFactor?.toFixed(2) || 0}x
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Gross profit / Gross loss ratio
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Max Drawdown</span>
              <span className="text-red-400 font-semibold">
                {pnl.maxDrawdown?.toFixed(2) || 0}%
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Largest peak to trough decline
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PnLDashboard;
