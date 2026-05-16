import React, { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Shield, Activity } from "lucide-react";
import axios from "axios";

const RiskHeatmap = () => {
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [correlation, setCorrelation] = useState(null);

  useEffect(() => {
    fetchRiskData();
    const interval = setInterval(fetchRiskData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchRiskData = async () => {
    try {
      const [heatmapRes, correlationRes] = await Promise.all([
        axios.get("/api/risk-heatmap"),
        axios.get("/api/correlation-matrix"),
      ]);
      setHeatmap(heatmapRes.data);
      setCorrelation(correlationRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch risk data:", error);
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "critical":
        return "bg-red-600/20 text-red-300 border-red-600/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading risk data...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Risk Heatmap</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">
              Position Concentration Risk
            </h2>
          </div>
          <div className="space-y-3">
            {heatmap?.positions &&
              heatmap.positions.map((pos, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${getRiskColor(pos.riskLevel)}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{pos.tokenSymbol}</span>
                    <span className="text-sm font-bold">
                      {pos.concentration.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        pos.riskLevel === "high" || pos.riskLevel === "critical"
                          ? "bg-red-600"
                          : pos.riskLevel === "medium"
                            ? "bg-yellow-600"
                            : "bg-green-600"
                      }`}
                      style={{ width: `${Math.min(pos.concentration, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Value: ${(pos.value || 0).toFixed(2)}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Risk Metrics</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Portfolio Exposure</span>
                <span className="text-white font-semibold">
                  {heatmap?.portfolioExposure?.toFixed(2) || 0}%
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Percentage of total portfolio at risk
              </p>
            </div>

            <div className="bg-slate-800/50 rounded p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Value at Risk (95%)</span>
                <span className="text-red-400 font-semibold">
                  ${heatmap?.valueAtRisk95?.toFixed(2) || 0}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Max expected loss at 95% confidence
              </p>
            </div>

            <div className="bg-slate-800/50 rounded p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Sharpe Ratio</span>
                <span className="text-blue-400 font-semibold">
                  {heatmap?.sharpeRatio?.toFixed(2) || 0}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Risk-adjusted return metric
              </p>
            </div>
          </div>
        </div>
      </div>

      {correlation && (
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Correlation Matrix</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400">
                    Asset Pair
                  </th>
                  <th className="text-right px-4 py-2 text-gray-400">
                    Correlation
                  </th>
                  <th className="text-right px-4 py-2 text-gray-400">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {correlation.pairs &&
                  correlation.pairs.map((pair, idx) => (
                    <tr key={idx} className="border-t border-slate-700">
                      <td className="px-4 py-3 text-white">{pair.assets}</td>
                      <td className="text-right px-4 py-3">
                        <span
                          className={`font-semibold ${pair.correlation > 0.7 ? "text-red-400" : pair.correlation > 0.4 ? "text-yellow-400" : "text-green-400"}`}
                        >
                          {pair.correlation.toFixed(3)}
                        </span>
                      </td>
                      <td className="text-right px-4 py-3">
                        <span className={getRiskColor(pair.riskLevel)}>
                          {pair.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskHeatmap;
