import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Trophy,
  Eye,
  Calendar,
  Download,
} from "lucide-react";
import axios from "axios";

const PerformanceAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month"); // week, month, quarter, year, all
  const [metric, setMetric] = useState("total"); // total, daily, weekly

  useEffect(() => {
    fetchAnalytics();
  }, [period, metric]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        "/api/performance-analytics",
        {
          params: {
            period: period,
            metric: metric,
          },
        },
      );
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading performance data...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Performance Analytics
          </h1>
          <p className="text-gray-400">
            Track your trading performance metrics
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-700 border border-purple-500/30 rounded px-3 py-2 text-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full bg-slate-700 border border-purple-500/30 rounded px-3 py-2 text-white"
            >
              <option value="total">Total Returns</option>
              <option value="daily">Daily Returns</option>
              <option value="weekly">Weekly Returns</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Win Rate</p>
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {analytics.winRate?.toFixed(1) || "0"}%
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {analytics.totalTrades || 0} trades analyzed
          </p>
        </div>

        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Profit Factor</p>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {analytics.profitFactor?.toFixed(2) || "0"}x
          </p>
          <p className="text-xs text-gray-400 mt-2">Gains / Losses ratio</p>
        </div>

        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Sharpe Ratio</p>
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {analytics.sharpeRatio?.toFixed(2) || "0"}
          </p>
          <p className="text-xs text-gray-400 mt-2">Risk-adjusted returns</p>
        </div>

        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Max Drawdown</p>
            <Eye className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">
            {analytics.maxDrawdown?.toFixed(1) || "0"}%
          </p>
          <p className="text-xs text-gray-400 mt-2">Peak to trough decline</p>
        </div>
      </div>

      {/* Return Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Return Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Total Return</p>
              <p
                className={`font-semibold ${analytics.totalReturn >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {analytics.totalReturn >= 0 ? "+" : ""}
                {analytics.totalReturn?.toFixed(2)}%
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Average Trade Return</p>
              <p
                className={`font-semibold ${analytics.avgTradeReturn >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {analytics.avgTradeReturn >= 0 ? "+" : ""}
                {analytics.avgTradeReturn?.toFixed(2)}%
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Best Trade</p>
              <p className="font-semibold text-green-400">
                +{analytics.bestTrade?.toFixed(2)}%
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Worst Trade</p>
              <p className="font-semibold text-red-400">
                {analytics.worstTrade?.toFixed(2)}%
              </p>
            </div>
            <div className="h-px bg-purple-500/20 my-4" />
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Annualized Return</p>
              <p
                className={`font-semibold text-lg ${analytics.annualizedReturn >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {analytics.annualizedReturn >= 0 ? "+" : ""}
                {analytics.annualizedReturn?.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Risk Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Volatility</p>
              <p className="font-semibold text-orange-400">
                {analytics.volatility?.toFixed(2)}%
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Standard Deviation</p>
              <p className="font-semibold text-blue-400">
                {analytics.stdDeviation?.toFixed(4)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Value at Risk (95%)</p>
              <p className="font-semibold text-red-400">
                {analytics.var95?.toFixed(2)}%
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Sortino Ratio</p>
              <p className="font-semibold text-purple-400">
                {analytics.sortinoRatio?.toFixed(2)}
              </p>
            </div>
            <div className="h-px bg-purple-500/20 my-4" />
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Recovery Factor</p>
              <p className="font-semibold text-emerald-400">
                {analytics.recoveryFactor?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Distribution */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          Trade Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-2">Winning Trades</p>
            <p className="text-3xl font-bold text-green-400">
              {analytics.winningTrades || 0}
            </p>
            <div className="w-full h-2 bg-slate-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${(analytics.winningTrades / (analytics.totalTrades || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Losing Trades</p>
            <p className="text-3xl font-bold text-red-400">
              {analytics.losingTrades || 0}
            </p>
            <div className="w-full h-2 bg-slate-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${(analytics.losingTrades / (analytics.totalTrades || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Break-Even Trades</p>
            <p className="text-3xl font-bold text-gray-400">
              {analytics.breakEvenTrades || 0}
            </p>
            <div className="w-full h-2 bg-slate-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gray-500"
                style={{
                  width: `${(analytics.breakEvenTrades / (analytics.totalTrades || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/10">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                  Month
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                  Trades
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                  Win Rate
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                  Return
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                  Profit/Loss
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.monthlyData?.map((month, idx) => (
                <tr
                  key={idx}
                  className="border-b border-purple-500/10 hover:bg-purple-500/10 transition-colors"
                >
                  <td className="px-4 py-3 text-white">{month.month}</td>
                  <td className="px-4 py-3 text-gray-300">{month.trades}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {month.winRate?.toFixed(1)}%
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${month.return >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {month.return >= 0 ? "+" : ""}
                    {month.return?.toFixed(2)}%
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${month.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {month.pnl >= 0 ? "+" : ""}${month.pnl?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
