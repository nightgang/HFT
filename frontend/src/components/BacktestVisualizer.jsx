import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Target, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

function BacktestVisualizer({ backtestData }) {
  const [activeTab, setActiveTab] = useState('equity');
  const equityChartRef = useRef(null);
  const priceChartRef = useRef(null);
  const drawdownChartRef = useRef(null);
  const equityChart = useRef(null);
  const priceChart = useRef(null);
  const drawdownChart = useRef(null);

  useEffect(() => {
    if (!backtestData || !backtestData.chartData) return;

    // Cleanup previous charts
    if (equityChart.current) {
      equityChart.current.remove();
    }
    if (priceChart.current) {
      priceChart.current.remove();
    }
    if (drawdownChart.current) {
      drawdownChart.current.remove();
    }

    initializeCharts();
  }, [backtestData]);

  const initializeCharts = () => {
    const { chartData, analytics, riskMetrics } = backtestData;

    // Equity Curve Chart
    if (equityChartRef.current) {
      equityChart.current = createChart(equityChartRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
          fontSize: 12,
        },
        grid: {
          vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
          horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
        },
        timeScale: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
          timeVisible: true,
        },
        width: equityChartRef.current.clientWidth,
        height: 300,
      });

      const equitySeries = equityChart.current.addLineSeries({
        color: analytics.totalReturn >= 0 ? '#10b981' : '#ef4444',
        lineWidth: 2,
      });

      const equityData = chartData.equityCurve.map(point => ({
        time: new Date(point.date).getTime() / 1000,
        value: point.capital
      }));

      equitySeries.setData(equityData);
    }

    // Price Chart with Trade Markers
    if (priceChartRef.current) {
      priceChart.current = createChart(priceChartRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
          fontSize: 12,
        },
        grid: {
          vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
          horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
        },
        timeScale: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
          timeVisible: true,
        },
        width: priceChartRef.current.clientWidth,
        height: 300,
      });

      const priceSeries = priceChart.current.addLineSeries({
        color: '#3b82f6',
        lineWidth: 1,
      });

      const priceData = chartData.equityCurve.map(point => ({
        time: new Date(point.date).getTime() / 1000,
        value: point.price
      }));

      priceSeries.setData(priceData);

      // Add trade markers
      const markers = chartData.tradeMarkers.map(trade => ({
        time: new Date(trade.date).getTime() / 1000,
        position: trade.type === 'BUY' ? 'belowBar' : 'aboveBar',
        color: trade.type === 'BUY' ? '#10b981' : '#ef4444',
        shape: trade.type === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: `${trade.type} @ $${trade.price.toFixed(4)}`
      }));

      priceSeries.setMarkers(markers);
    }

    // Drawdown Chart
    if (drawdownChartRef.current && chartData.drawdownPeriods) {
      drawdownChart.current = createChart(drawdownChartRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
          fontSize: 12,
        },
        grid: {
          vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
          horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
        },
        timeScale: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
          timeVisible: true,
        },
        width: drawdownChartRef.current.clientWidth,
        height: 200,
      });

      const drawdownSeries = drawdownChart.current.addAreaSeries({
        topColor: 'rgba(239, 68, 68, 0.56)',
        bottomColor: 'rgba(239, 68, 68, 0.04)',
        lineColor: 'rgba(239, 68, 68, 1)',
        lineWidth: 2,
      });

      // Calculate drawdown over time
      const drawdownData = [];
      let peak = chartData.equityCurve[0].capital;

      chartData.equityCurve.forEach(point => {
        if (point.capital > peak) peak = point.capital;
        const drawdown = ((peak - point.capital) / peak) * 100;
        drawdownData.push({
          time: new Date(point.date).getTime() / 1000,
          value: -drawdown // Negative for visual
        });
      });

      drawdownSeries.setData(drawdownData);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (!backtestData) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900/50 rounded-lg border border-slate-700">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Run a backtest to see results</p>
        </div>
      </div>
    );
  }

  const { analytics, riskMetrics } = backtestData;

  return (
    <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Backtest Results</h3>
            <p className="text-slate-400">{backtestData.strategy} Strategy</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className={`text-2xl font-bold ${analytics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(analytics.totalReturn)}
              </div>
              <div className="text-sm text-slate-400">Total Return</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6 border-b border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Win Rate</p>
                <p className="text-white font-semibold">{analytics.winRate}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Profit Factor</p>
                <p className="text-white font-semibold">{analytics.profitFactor}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Max Drawdown</p>
                <p className="text-red-400 font-semibold">-{riskMetrics.maxDrawdown}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Sharpe Ratio</p>
                <p className="text-white font-semibold">{riskMetrics.sharpeRatio}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="p-6">
        <div className="flex space-x-1 mb-4">
          {[
            { id: 'equity', label: 'Equity Curve', icon: TrendingUp },
            { id: 'price', label: 'Price & Trades', icon: BarChart3 },
            { id: 'drawdown', label: 'Drawdown', icon: TrendingDown }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="space-y-4">
          {activeTab === 'equity' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/30 rounded-lg p-4"
            >
              <h4 className="text-white font-semibold mb-4">Portfolio Equity Curve</h4>
              <div ref={equityChartRef} className="w-full h-64" />
            </motion.div>
          )}

          {activeTab === 'price' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/30 rounded-lg p-4"
            >
              <h4 className="text-white font-semibold mb-4">Price Chart with Trade Signals</h4>
              <div ref={priceChartRef} className="w-full h-64" />
              <div className="mt-4 flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-slate-400">Buy Signals</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-slate-400">Sell Signals</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'drawdown' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/30 rounded-lg p-4"
            >
              <h4 className="text-white font-semibold mb-4">Portfolio Drawdown</h4>
              <div ref={drawdownChartRef} className="w-full h-48" />
            </motion.div>
          )}
        </div>

        {/* Trade Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h5 className="text-white font-semibold mb-2">Trade Statistics</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Trades:</span>
                <span className="text-white">{analytics.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Winning Trades:</span>
                <span className="text-green-400">{analytics.winningTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Losing Trades:</span>
                <span className="text-red-400">{analytics.losingTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Win:</span>
                <span className="text-green-400">{formatCurrency(analytics.avgWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Loss:</span>
                <span className="text-red-400">{formatCurrency(analytics.avgLoss)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <h5 className="text-white font-semibold mb-2">Risk Metrics</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Sortino Ratio:</span>
                <span className="text-white">{riskMetrics.sortinoRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calmar Ratio:</span>
                <span className="text-white">{riskMetrics.calmarRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recovery Factor:</span>
                <span className="text-white">{riskMetrics.recoveryFactor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expectancy:</span>
                <span className="text-white">{formatCurrency(riskMetrics.expectancy)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <h5 className="text-white font-semibold mb-2">Performance vs Benchmark</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Strategy Return:</span>
                <span className={`font-semibold ${analytics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(analytics.totalReturn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Buy & Hold:</span>
                <span className="text-blue-400">{formatPercent(analytics.buyAndHoldReturn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Outperformance:</span>
                <span className={`font-semibold ${(analytics.totalReturn - analytics.buyAndHoldReturn) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(analytics.totalReturn - analytics.buyAndHoldReturn)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BacktestVisualizer;